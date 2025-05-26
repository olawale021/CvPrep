/**
 * React Hook for Cached API Operations
 * Provides loading states, error handling, and automatic cache management
 */

import { useCallback, useEffect, useState } from 'react';
import { api, apiClient, ApiError, ApiResponse, cacheManagement, RequestConfig } from '../lib/api-client';

// Hook state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  cached: boolean;
  lastFetch: Date | null;
}

// Hook options
interface UseApiOptions<T> extends Omit<RequestConfig, 'method' | 'body'> {
  immediate?: boolean; // Fetch immediately on mount
  refreshInterval?: number; // Auto-refresh interval in milliseconds
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  transform?: (data: any) => T; // Transform response data
  enabled?: boolean; // Enable/disable the hook
}

/**
 * Generic API hook for any endpoint
 */
export function useApi<T = any>(
  url: string,
  options: UseApiOptions<T> = {}
) {
  const {
    immediate = true,
    refreshInterval,
    onSuccess,
    onError,
    transform,
    enabled = true,
    ...requestConfig
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    cached: false,
    lastFetch: null,
  });

  // Fetch function
  const fetch = useCallback(async (overrideConfig?: Partial<RequestConfig>) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiClient.get<T>(url, {
        ...requestConfig,
        ...overrideConfig,
      });

      const transformedData = transform ? transform(response.data) : response.data;

      setState({
        data: transformedData,
        loading: false,
        error: null,
        cached: response.cached || false,
        lastFetch: new Date(),
      });

      onSuccess?.(transformedData);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError,
      }));

      onError?.(apiError);
      throw error;
    }
  }, [url, enabled, requestConfig, transform, onSuccess, onError]);

  // Refresh function (bypasses cache)
  const refresh = useCallback(async () => {
    await apiClient.invalidateCache(url);
    return fetch();
  }, [url, fetch]);

  // Mutate function (optimistic updates)
  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof newData === 'function' ? (newData as any)(prev.data) : newData,
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate && enabled) {
      fetch();
    }
  }, [immediate, enabled, fetch]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, enabled, fetch]);

  return {
    ...state,
    fetch,
    refresh,
    mutate,
    isStale: state.lastFetch ? Date.now() - state.lastFetch.getTime() > 60000 : false, // 1 minute
  };
}

/**
 * Hook for user profile data
 */
export function useUserProfile() {
  return useApi('/api/user/profile', {
    cache: 'USER_DATA',
    onError: (error) => {
      if (error.status === 401) {
        // Handle unauthorized access
        console.warn('User not authenticated');
      }
    },
  });
}

/**
 * Hook for system status
 */
export function useSystemStatus() {
  return useApi('/api/system/status', {
    cache: 'SYSTEM_STATUS',
    refreshInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for help articles
 */
export function useHelpArticles() {
  return useApi('/api/help/articles', {
    cache: 'HELP_CONTENT',
  });
}

/**
 * Hook for specific help article
 */
export function useHelpArticle(slug: string) {
  return useApi(`/api/help/articles/${slug}`, {
    cache: 'HELP_CONTENT',
    enabled: !!slug,
  });
}

/**
 * Hook for search functionality with debouncing
 */
export function useSearch<T = any>(query: string, endpoint: string, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useApi<T>(`${endpoint}?q=${encodeURIComponent(debouncedQuery)}`, {
    cache: 'SEARCH_RESULTS',
    enabled: debouncedQuery.length > 2, // Only search if query is longer than 2 characters
  });
}

/**
 * Hook for mutations (POST, PUT, DELETE operations)
 */
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    invalidateCache?: string[]; // Cache patterns to invalidate on success
  } = {}
) {
  const [state, setState] = useState<{
    data: TData | null;
    loading: boolean;
    error: ApiError | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (variables: TVariables) => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await mutationFn(variables);
      
      setState({
        data: response.data,
        loading: false,
        error: null,
      });

      // Invalidate specified cache patterns
      if (options.invalidateCache) {
        await Promise.all(
          options.invalidateCache.map(pattern => 
            apiClient.invalidateCache(pattern)
          )
        );
      }

      options.onSuccess?.(response.data, variables);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        loading: false,
        error: apiError,
      });

      options.onError?.(apiError, variables);
      throw error;
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

/**
 * Hook for resume operations
 */
export function useResumeOperations() {
  const analyzeResume = useMutation(
    (file: File) => api.resume.analyze(file),
    {
      onSuccess: () => {
        console.log('Resume analyzed successfully');
      },
      invalidateCache: ['/api/resume'],
    }
  );

  const optimizeResume = useMutation(
    ({ resumeId, jobDescription }: { resumeId: string; jobDescription: string }) =>
      api.resume.optimize(resumeId, jobDescription),
    {
      invalidateCache: ['/api/resume'],
    }
  );

  return {
    analyzeResume,
    optimizeResume,
  };
}

/**
 * Hook for user profile operations
 */
export function useUserOperations() {
  const updateProfile = useMutation(
    (data: any) => api.user.updateProfile(data),
    {
      onSuccess: () => {
        console.log('Profile updated successfully');
      },
      invalidateCache: ['/api/user'],
    }
  );

  const updateSettings = useMutation(
    (data: any) => api.user.updateSettings(data),
    {
      invalidateCache: ['/api/user'],
    }
  );

  return {
    updateProfile,
    updateSettings,
  };
}

/**
 * Hook for cache management
 */
export function useCacheManagement() {
  const [stats, setStats] = useState(apiClient.getCacheStats());

  const refreshStats = useCallback(() => {
    setStats(apiClient.getCacheStats());
  }, []);

  const clearCache = useCallback(async () => {
    await apiClient.clearCache();
    refreshStats();
  }, [refreshStats]);

  const invalidateUserCache = useCallback(async () => {
    await cacheManagement.invalidateUserCache();
    refreshStats();
  }, [refreshStats]);

  const invalidateResumeCache = useCallback(async (resumeId?: string) => {
    await cacheManagement.invalidateResumeCache(resumeId);
    refreshStats();
  }, [refreshStats]);

  const warmUpCache = useCallback(async () => {
    await apiClient.warmUpCache();
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    // Refresh stats periodically
    const interval = setInterval(refreshStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    clearCache,
    invalidateUserCache,
    invalidateResumeCache,
    warmUpCache,
    refreshStats,
  };
}

/**
 * Hook for infinite scrolling/pagination
 */
export function useInfiniteApi<T = any>(
  getUrl: (page: number) => string,
  options: UseApiOptions<T[]> & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { pageSize = 20, initialPage = 1, ...apiOptions } = options;
  
  const [pages, setPages] = useState<T[][]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const { data, loading, error, fetch } = useApi<T[]>(
    getUrl(currentPage),
    {
      ...apiOptions,
      immediate: false,
      onSuccess: (data) => {
        setPages(prev => {
          const newPages = [...prev];
          newPages[currentPage - 1] = data;
          return newPages;
        });
        
        setHasMore(data.length === pageSize);
        options.onSuccess?.(data);
      },
    }
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // Fetch next page
    await fetch();
  }, [hasMore, loading, currentPage, fetch]);

  const reset = useCallback(() => {
    setPages([]);
    setCurrentPage(initialPage);
    setHasMore(true);
  }, [initialPage]);

  // Initial load
  useEffect(() => {
    if (apiOptions.immediate !== false) {
      fetch();
    }
  }, [fetch, apiOptions.immediate]);

  const allData = pages.flat();

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    currentPage,
  };
}

// Export utility functions
export { cacheManagement };
