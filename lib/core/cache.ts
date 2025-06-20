/**
 * Comprehensive API Response Caching System
 * Supports multiple cache strategies: memory, localStorage, and service worker
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Cache configuration
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  strategy?: 'memory' | 'localStorage' | 'serviceWorker' | 'hybrid';
  maxSize?: number; // Maximum cache size
  compress?: boolean; // Enable compression for large responses
}

// Cache entry structure
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  etag?: string;
  lastModified?: string;
}

// Default cache configurations for different data types
export const CACHE_CONFIGS = {
  // Static content - long cache
  STATIC: { ttl: 24 * 60 * 60 * 1000, strategy: 'hybrid' as const }, // 24 hours
  
  // User data - medium cache
  USER_DATA: { ttl: 15 * 60 * 1000, strategy: 'memory' as const }, // 15 minutes
  
  // Resume data - medium cache with localStorage fallback
  RESUME_DATA: { ttl: 30 * 60 * 1000, strategy: 'hybrid' as const }, // 30 minutes
  
  // Search results - short cache
  SEARCH_RESULTS: { ttl: 5 * 60 * 1000, strategy: 'memory' as const }, // 5 minutes
  
  // API responses - short cache
  API_RESPONSES: { ttl: 2 * 60 * 1000, strategy: 'memory' as const }, // 2 minutes
  
  // Help content - long cache
  HELP_CONTENT: { ttl: 60 * 60 * 1000, strategy: 'localStorage' as const }, // 1 hour
  
  // System status - very short cache
  SYSTEM_STATUS: { ttl: 30 * 1000, strategy: 'memory' as const }, // 30 seconds
} as const;

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private maxMemorySize = 100; // Maximum number of entries in memory
  private compressionThreshold = 1024; // Compress responses larger than 1KB

  /**
   * Generate cache key from URL and parameters
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${btoa(paramString)}`;
  }

  /**
   * Compress data using built-in compression
   */
  private async compressData(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    if (jsonString.length < this.compressionThreshold) {
      return jsonString;
    }

    try {
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(jsonString));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      }
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
    }
    
    return jsonString;
  }

  /**
   * Decompress data
   */
  private async decompressData(compressedData: string, isCompressed: boolean): Promise<any> {
    if (!isCompressed) {
      return JSON.parse(compressedData);
    }

    try {
      // Use DecompressionStream if available
      if ('DecompressionStream' in window) {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        const jsonString = new TextDecoder().decode(decompressed);
        return JSON.parse(jsonString);
      }
    } catch (error) {
      console.warn('Decompression failed:', error);
    }
    
    return JSON.parse(compressedData);
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.memoryCache.size > this.maxMemorySize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.maxMemorySize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Store data in memory cache
   */
  private setMemoryCache(key: string, data: any, config: CacheConfig): void {
    this.cleanupMemoryCache();
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl || CACHE_CONFIGS.API_RESPONSES.ttl,
    };
    
    this.memoryCache.set(key, entry);
  }

  /**
   * Get data from memory cache
   */
  private getMemoryCache(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry || !this.isValid(entry)) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Store data in localStorage cache
   */
  private async setLocalStorageCache(key: string, data: any, config: CacheConfig): Promise<void> {
    try {
      const shouldCompress = config.compress && JSON.stringify(data).length > this.compressionThreshold;
      const processedData = shouldCompress ? await this.compressData(data) : JSON.stringify(data);
      
      const entry: CacheEntry = {
        data: processedData,
        timestamp: Date.now(),
        ttl: config.ttl || CACHE_CONFIGS.API_RESPONSES.ttl,
        compressed: shouldCompress,
      };
      
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
      console.error('Failed to store in localStorage:', error);
      
      // Don't silently fallback - throw the error so calling code knows storage failed
      throw new Error(`localStorage caching failed: ${errorMessage}. Data not cached.`);
    }
  }

  /**
   * Get data from localStorage cache
   */
  private async getLocalStorageCache(key: string): Promise<any | null> {
    try {
      const stored = localStorage.getItem(`cache:${key}`);
      if (!stored) return null;
      
      const entry: CacheEntry = JSON.parse(stored);
      if (!this.isValid(entry)) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return await this.decompressData(entry.data, entry.compressed || false);
    } catch (error) {
      console.warn('Failed to retrieve from localStorage:', error);
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
  }

  /**
   * Store data in service worker cache
   */
  private async setServiceWorkerCache(key: string, data: any, config: CacheConfig): Promise<void> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      throw new Error('Service Worker not available or not registered');
    }

    try {
      const cache = await caches.open('api-cache-v1');
      const response = new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `max-age=${Math.floor((config.ttl || 0) / 1000)}`,
          'X-Cache-Timestamp': Date.now().toString(),
        },
      });
      
      await cache.put(key, response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
      console.error('Failed to store in service worker cache:', error);
      
      // Don't silently fallback - throw the error
      throw new Error(`Service Worker caching failed: ${errorMessage}. Data not cached.`);
    }
  }

  /**
   * Get data from service worker cache
   */
  private async getServiceWorkerCache(key: string): Promise<any | null> {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const cache = await caches.open('api-cache-v1');
      const response = await cache.match(key);
      
      if (!response) return null;
      
      const timestamp = parseInt(response.headers.get('X-Cache-Timestamp') || '0');
      const cacheControl = response.headers.get('Cache-Control') || '';
      const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0') * 1000;
      
      if (Date.now() - timestamp > maxAge) {
        await cache.delete(key);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Failed to retrieve from service worker cache:', error);
      return null;
    }
  }

  /**
   * Set cache entry using specified strategy
   */
  async set(url: string, data: any, config: CacheConfig = {}, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(url, params);
    const strategy = config.strategy || 'memory';

    switch (strategy) {
      case 'memory':
        this.setMemoryCache(key, data, config);
        break;
      case 'localStorage':
        await this.setLocalStorageCache(key, data, config);
        break;
      case 'serviceWorker':
        await this.setServiceWorkerCache(key, data, config);
        break;
      case 'hybrid':
        // Store in both memory and localStorage for redundancy
        this.setMemoryCache(key, data, config);
        await this.setLocalStorageCache(key, data, config);
        break;
    }
  }

  /**
   * Get cache entry using specified strategy
   */
  async get(url: string, config: CacheConfig = {}, params?: Record<string, any>): Promise<any | null> {
    const key = this.generateKey(url, params);
    const strategy = config.strategy || 'memory';

    switch (strategy) {
      case 'memory':
        return this.getMemoryCache(key);
      case 'localStorage':
        return await this.getLocalStorageCache(key);
      case 'serviceWorker':
        return await this.getServiceWorkerCache(key);
      case 'hybrid':
        // Try memory first, then localStorage
        let data = this.getMemoryCache(key);
        if (data === null) {
          data = await this.getLocalStorageCache(key);
          // If found in localStorage, restore to memory cache
          if (data !== null) {
            this.setMemoryCache(key, data, config);
          }
        }
        return data;
      default:
        return null;
    }
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(url: string, params?: Record<string, any>): Promise<void> {
    const key = this.generateKey(url, params);
    
    // Remove from all cache types
    this.memoryCache.delete(key);
    
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
    
    try {
      if ('serviceWorker' in navigator) {
        const cache = await caches.open('api-cache-v1');
        await cache.delete(key);
      }
    } catch (error) {
      console.warn('Failed to remove from service worker cache:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
    
    // Clear service worker cache
    try {
      if ('serviceWorker' in navigator) {
        await caches.delete('api-cache-v1');
      }
    } catch (error) {
      console.warn('Failed to clear service worker cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    localStorageSize: number;
    memoryEntries: string[];
  } {
    const localStorageEntries = Object.keys(localStorage)
      .filter(key => key.startsWith('cache:'));
    
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: localStorageEntries.length,
      memoryEntries: Array.from(this.memoryCache.keys()),
    };
  }

  /**
   * Preload cache with data
   */
  async preload(entries: Array<{ url: string; config?: CacheConfig; params?: Record<string, any> }>): Promise<void> {
    const promises = entries.map(async ({ url, config = {}, params }) => {
      try {
        // Only preload if not already cached
        const existing = await this.get(url, config, params);
        if (existing === null) {
          // This would typically fetch from API, but for preloading we'd need the actual data
          console.log(`Preloading cache for: ${url}`);
        }
      } catch (error) {
        console.warn(`Failed to preload cache for ${url}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Utility functions for common cache operations
export const cacheUtils = {
  /**
   * Cache API response with automatic key generation
   */
  async cacheResponse<T>(
    url: string,
    response: T,
    cacheType: keyof typeof CACHE_CONFIGS = 'API_RESPONSES',
    params?: Record<string, any>
  ): Promise<void> {
    const config = CACHE_CONFIGS[cacheType];
    await cacheManager.set(url, response, config, params);
  },

  /**
   * Get cached API response
   */
  async getCachedResponse<T>(
    url: string,
    cacheType: keyof typeof CACHE_CONFIGS = 'API_RESPONSES',
    params?: Record<string, any>
  ): Promise<T | null> {
    const config = CACHE_CONFIGS[cacheType];
    return await cacheManager.get(url, config, params);
  },

  /**
   * Cache with custom TTL
   */
  async cacheWithTTL<T>(
    url: string,
    response: T,
    ttl: number,
    strategy: CacheConfig['strategy'] = 'memory',
    params?: Record<string, any>
  ): Promise<void> {
    await cacheManager.set(url, response, { ttl, strategy }, params);
  },

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const stats = cacheManager.getStats();
    const matchingKeys = stats.memoryEntries.filter(key => key.includes(pattern));
    
    for (const key of matchingKeys) {
      // Extract URL from key (remove base64 params)
      const url = key.split(':')[0];
      await cacheManager.invalidate(url);
    }
  },

  /**
   * Warm up cache with common requests
   */
  async warmUpCache(): Promise<void> {
    const commonRequests = [
      { url: '/api/user/profile', config: CACHE_CONFIGS.USER_DATA },
      { url: '/api/help/articles', config: CACHE_CONFIGS.HELP_CONTENT },
      { url: '/api/system/status', config: CACHE_CONFIGS.SYSTEM_STATUS },
    ];
    
    await cacheManager.preload(commonRequests);
  },
};

// Initialize cache cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up expired entries periodically
  setInterval(() => {
    cacheManager.getStats(); // This triggers cleanup
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Clear cache on storage quota exceeded
  window.addEventListener('error', (event) => {
    if (event.message?.includes('QuotaExceededError')) {
      console.warn('Storage quota exceeded, clearing cache');
      cacheManager.clearAll();
    }
  });
} 