/**
 * Service Worker Registration and Management
 * Handles registration, updates, and communication with the service worker
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Service worker events
export interface ServiceWorkerEvents {
  'sw-registered': ServiceWorkerRegistration;
  'sw-updated': ServiceWorkerRegistration;
  'sw-offline': void;
  'sw-online': void;
  'sw-cache-updated': string;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private eventListeners: Map<keyof ServiceWorkerEvents, Array<(data: any) => void>> = new Map();
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;
      this.setupServiceWorkerListeners(registration);
      this.emit('sw-registered', registration);

      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Setup service worker event listeners
   */
  private setupServiceWorkerListeners(registration: ServiceWorkerRegistration): void {
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is available
          this.emit('sw-updated', registration);
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      this.handleServiceWorkerMessage(type, payload);
    });

    // Listen for controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(type: string, payload: any): void {
    switch (type) {
      case 'CACHE_UPDATED':
        this.emit('sw-cache-updated', payload.url);
        break;
      case 'OFFLINE_READY':
        console.log('App is ready for offline use');
        break;
      default:
        console.log('Unknown service worker message:', type, payload);
    }
  }

  /**
   * Setup online/offline listeners
   */
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('sw-online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('sw-offline');
    });
  }

  /**
   * Send message to service worker
   */
  async sendMessage(type: string, payload?: any): Promise<any> {
    if (!this.registration || !navigator.serviceWorker.controller) {
      throw new Error('Service Worker not available');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type, payload },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Update service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    await this.registration.update();
  }

  /**
   * Skip waiting for new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    await this.sendMessage('CACHE_URLS', { urls });
  }

  /**
   * Clear cache
   */
  async clearCache(cacheName?: string): Promise<void> {
    await this.sendMessage('CLEAR_CACHE', { cacheName });
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    const response = await this.sendMessage('GET_CACHE_SIZE');
    return response.size;
  }

  /**
   * Check if app is online
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get service worker registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Add event listener
   */
  on<K extends keyof ServiceWorkerEvents>(
    event: K,
    listener: (data: ServiceWorkerEvents[K]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off<K extends keyof ServiceWorkerEvents>(
    event: K,
    listener: (data: ServiceWorkerEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit<K extends keyof ServiceWorkerEvents>(
    event: K,
    data: ServiceWorkerEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const result = await this.registration.unregister();
    if (result) {
      this.registration = null;
    }
    return result;
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register service worker in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register();
}

// React hook for service worker
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => {
    // Register service worker
    serviceWorkerManager.register().then(setRegistration);

    // Setup event listeners
    const handleRegistered = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
    };

    const handleUpdated = () => {
      setUpdateAvailable(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    serviceWorkerManager.on('sw-registered', handleRegistered);
    serviceWorkerManager.on('sw-updated', handleUpdated);
    serviceWorkerManager.on('sw-online', handleOnline);
    serviceWorkerManager.on('sw-offline', handleOffline);

    // Get initial cache size
    serviceWorkerManager.getCacheSize().then(setCacheSize).catch(() => {
      // Ignore errors
    });

    return () => {
      serviceWorkerManager.off('sw-registered', handleRegistered);
      serviceWorkerManager.off('sw-updated', handleUpdated);
      serviceWorkerManager.off('sw-online', handleOnline);
      serviceWorkerManager.off('sw-offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = useCallback(async () => {
    await serviceWorkerManager.skipWaiting();
    setUpdateAvailable(false);
  }, []);

  const clearCache = useCallback(async () => {
    await serviceWorkerManager.clearCache();
    const newSize = await serviceWorkerManager.getCacheSize();
    setCacheSize(newSize);
  }, []);

  const refreshCacheSize = useCallback(async () => {
    try {
      const size = await serviceWorkerManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.warn('Failed to get cache size:', error);
    }
  }, []);

  return {
    registration,
    isOnline,
    updateAvailable,
    cacheSize: formatBytes(cacheSize),
    updateServiceWorker,
    clearCache,
    refreshCacheSize,
  };
}

// Utility function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Cache management utilities
export const cacheUtils = {
  /**
   * Preload critical resources
   */
  async preloadCriticalResources(): Promise<void> {
    const criticalUrls = [
      '/',
      '/help',
      '/resume/optimize',
      '/api/user/profile',
      '/api/help/categories',
    ];

    await serviceWorkerManager.cacheUrls(criticalUrls);
  },

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    await serviceWorkerManager.clearCache();
  },

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    size: number;
    formattedSize: string;
  }> {
    const size = await serviceWorkerManager.getCacheSize();
    return {
      size,
      formattedSize: formatBytes(size),
    };
  },
};

// Export types and utilities
export { formatBytes };
export type { ServiceWorkerEvents };

// Import React hooks
    import { useCallback, useEffect, useState } from 'react';
