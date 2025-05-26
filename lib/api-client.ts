/**
 * Cached API Client
 * Automatically handles caching for API requests with intelligent cache strategies
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { CACHE_CONFIGS, CacheConfig, cacheManager, cacheUtils } from './cache';

// API response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: number;
  cached?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(options: { message: string; status: number; code?: string; details?: any }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: CacheConfig | keyof typeof CACHE_CONFIGS | false;
  timeout?: number;
  retries?: number;
  validateStatus?: (status: number) => boolean;
}

// Cache strategy mapping for different endpoints
const ENDPOINT_CACHE_STRATEGIES: Record<string, keyof typeof CACHE_CONFIGS> = {
  // User endpoints
  '/api/user/profile': 'USER_DATA',
  '/api/user/settings': 'USER_DATA',
  '/api/user/preferences': 'USER_DATA',
  
  // Resume endpoints
  '/api/resume/analyze': 'RESUME_DATA',
  '/api/resume/optimize': 'RESUME_DATA',
  '/api/resume/score': 'RESUME_DATA',
  '/api/resume/templates': 'STATIC',
  
  // Help center endpoints
  '/api/help/articles': 'HELP_CONTENT',
  '/api/help/categories': 'HELP_CONTENT',
  '/api/help/search': 'SEARCH_RESULTS',
  
  // System endpoints
  '/api/system/status': 'SYSTEM_STATUS',
  '/api/system/health': 'SYSTEM_STATUS',
  
  // Static content
  '/api/content/templates': 'STATIC',
  '/api/content/examples': 'STATIC',
};

class CachedApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: any) => any | Promise<any>> = [];

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: any) => any | Promise<any>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Determine cache strategy for endpoint
   */
  private getCacheStrategy(url: string): keyof typeof CACHE_CONFIGS {
    // Check exact matches first
    if (ENDPOINT_CACHE_STRATEGIES[url]) {
      return ENDPOINT_CACHE_STRATEGIES[url];
    }

    // Check pattern matches
    for (const [pattern, strategy] of Object.entries(ENDPOINT_CACHE_STRATEGIES)) {
      if (url.startsWith(pattern.replace('*', ''))) {
        return strategy;
      }
    }

    // Default strategy
    return 'API_RESPONSES';
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(url: string, config: RequestConfig): string {
    const method = config.method || 'GET';
    const body = config.body ? JSON.stringify(config.body) : '';
    return `${method}:${url}:${btoa(body)}`;
  }

  /**
   * Check if request should be cached
   */
  private shouldCache(method: string, config: RequestConfig): boolean {
    // Don't cache if explicitly disabled
    if (config.cache === false) return false;
    
    // Only cache GET requests by default
    if (method !== 'GET') return false;
    
    return true;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: any): Promise<any> {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Make HTTP request with caching
   */
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const method = config.method || 'GET';
    
    // Apply request interceptors
    const processedConfig = await this.applyRequestInterceptors(config);
    
    // Check cache for GET requests
    if (this.shouldCache(method, processedConfig)) {
      const cacheStrategy = typeof processedConfig.cache === 'string' 
        ? processedConfig.cache 
        : this.getCacheStrategy(url);
      
      const cacheKey = this.generateCacheKey(url, processedConfig);
      const cachedResponse = await cacheUtils.getCachedResponse<T>(cacheKey, cacheStrategy);
      
      if (cachedResponse) {
        return {
          data: cachedResponse,
          success: true,
          timestamp: Date.now(),
          cached: true,
        };
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...processedConfig.headers,
      },
      signal: processedConfig.timeout ? AbortSignal.timeout(processedConfig.timeout) : undefined,
    };

    // Add body for non-GET requests
    if (method !== 'GET' && processedConfig.body) {
      requestOptions.body = typeof processedConfig.body === 'string' 
        ? processedConfig.body 
        : JSON.stringify(processedConfig.body);
    }

    // Make request with retries
    let lastError: Error | null = null;
    const maxRetries = processedConfig.retries || 0;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(fullUrl, requestOptions);
        
        // Check if response status is valid
        const isValidStatus = processedConfig.validateStatus 
          ? processedConfig.validateStatus(response.status)
          : response.status >= 200 && response.status < 300;
        
        if (!isValidStatus) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        // Parse response
        const responseData = await response.json();
        
        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(responseData);
        
        const apiResponse: ApiResponse<T> = {
          data: processedResponse,
          success: true,
          timestamp: Date.now(),
          cached: false,
        };

        // Cache successful GET responses
        if (this.shouldCache(method, processedConfig) && response.ok) {
          const cacheStrategy = typeof processedConfig.cache === 'string' 
            ? processedConfig.cache 
            : this.getCacheStrategy(url);
          
          const cacheKey = this.generateCacheKey(url, processedConfig);
          await cacheUtils.cacheResponse(cacheKey, processedResponse, cacheStrategy);
        }

        return apiResponse;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error, might be worth retrying
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break;
        }
        
        // Retry on 5xx errors (server errors)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        break;
      }
    }

    // If we get here, all retries failed
    throw new ApiError({
      message: lastError?.message || 'Request failed',
      status: 0,
      code: 'REQUEST_FAILED',
      details: lastError,
    });
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data });
  }

  /**
   * Invalidate cache for specific URL pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    await cacheUtils.invalidatePattern(pattern);
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    await cacheManager.clearAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Warm up cache with common requests
   */
  async warmUpCache(): Promise<void> {
    await cacheUtils.warmUpCache();
  }
}

// Create default API client instance
export const apiClient = new CachedApiClient(process.env.NEXT_PUBLIC_API_URL || '');

// Add authentication interceptor
apiClient.addRequestInterceptor(async (config) => {
  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add error handling interceptor
apiClient.addResponseInterceptor(async (response) => {
  // Handle common response transformations
  if (response && typeof response === 'object') {
    // Transform timestamps
    if (response.timestamp) {
      response.timestamp = new Date(response.timestamp);
    }
    
    // Transform nested timestamps
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map((item: any) => {
        if (item.timestamp) {
          item.timestamp = new Date(item.timestamp);
        }
        return item;
      });
    }
  }
  
  return response;
});

// Utility functions for common API operations
export const api = {
  // User operations
  user: {
    getProfile: () => apiClient.get('/api/user/profile'),
    updateProfile: (data: any) => apiClient.put('/api/user/profile', data),
    getSettings: () => apiClient.get('/api/user/settings'),
    updateSettings: (data: any) => apiClient.put('/api/user/settings', data),
  },

  // Resume operations
  resume: {
    analyze: (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return apiClient.post('/api/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        cache: false, // Don't cache file uploads
      });
    },
    optimize: (resumeId: string, jobDescription: string) => 
      apiClient.post('/api/resume/optimize', { resumeId, jobDescription }),
    getScore: (resumeId: string) => apiClient.get(`/api/resume/${resumeId}/score`),
    getTemplates: () => apiClient.get('/api/resume/templates'),
  },

  // Help center operations
  help: {
    getArticles: () => apiClient.get('/api/help/articles'),
    getArticle: (slug: string) => apiClient.get(`/api/help/articles/${slug}`),
    getCategories: () => apiClient.get('/api/help/categories'),
    search: (query: string) => apiClient.get(`/api/help/search?q=${encodeURIComponent(query)}`, { 
      cache: 'SEARCH_RESULTS',
    }),
  },

  // System operations
  system: {
    getStatus: () => apiClient.get('/api/system/status'),
    getHealth: () => apiClient.get('/api/system/health'),
  },
};



// Cache management utilities
export const cacheManagement = {
  /**
   * Invalidate user-related cache when user data changes
   */
  invalidateUserCache: async () => {
    await apiClient.invalidateCache('/api/user');
  },

  /**
   * Invalidate resume cache when resume data changes
   */
  invalidateResumeCache: async (resumeId?: string) => {
    if (resumeId) {
      await apiClient.invalidateCache(`/api/resume/${resumeId}`);
    } else {
      await apiClient.invalidateCache('/api/resume');
    }
  },

  /**
   * Refresh system status cache
   */
  refreshSystemStatus: async () => {
    await apiClient.invalidateCache('/api/system/status');
    return api.system.getStatus();
  },

  /**
   * Preload critical data
   */
  preloadCriticalData: async () => {
    try {
      await Promise.allSettled([
        api.user.getProfile(),
        api.help.getCategories(),
        api.system.getStatus(),
      ]);
    } catch (error) {
      console.warn('Failed to preload some critical data:', error);
    }
  },
};

// Initialize cache warming on client side
if (typeof window !== 'undefined') {
  // Warm up cache after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      cacheManagement.preloadCriticalData();
    }, 1000);
  });
} 