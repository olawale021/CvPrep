/**
 * Cache Management Component
 * Provides UI for monitoring and managing the caching system
 */

"use client";

import {
    BarChart3,
    Database,
    HardDrive,
    RefreshCw,
    Settings,
    Trash2,
    Wifi,
    WifiOff
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCacheManagement } from "../hooks/api/useApi";
import { useServiceWorker } from "../lib/services/service-worker";
import { Button } from "./ui/base/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/base/Card";

interface CacheEntry {
  key: string;
  size: number;
  timestamp: number;
  ttl: number;
  strategy: string;
}

interface CacheStats {
  memorySize: number;
  localStorageSize: number;
  serviceWorkerSize: number;
  totalEntries: number;
  hitRate: number;
  missRate: number;
}

export default function CacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'settings'>('overview');
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    memorySize: 0,
    localStorageSize: 0,
    serviceWorkerSize: 0,
    totalEntries: 0,
    hitRate: 0,
    missRate: 0,
  });

  const {
    stats,
    clearCache,
    invalidateUserCache,
    invalidateResumeCache,
    warmUpCache,
    refreshStats,
  } = useCacheManagement();

  const {
    registration,
    isOnline,
    updateAvailable,
    cacheSize,
    updateServiceWorker,
    clearCache: clearServiceWorkerCache,
    refreshCacheSize,
  } = useServiceWorker();

  // Load cache entries and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cache entries from localStorage
        const entries: CacheEntry[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('cache:')) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              entries.push({
                key: key.replace('cache:', ''),
                size: new Blob([JSON.stringify(data)]).size,
                timestamp: data.timestamp || 0,
                ttl: data.ttl || 0,
                strategy: 'localStorage',
              });
            } catch {
              console.warn('Failed to parse cache entry:', key);
            }
          }
        }
        setCacheEntries(entries);

        // Calculate stats
        setCacheStats({
          memorySize: stats.memorySize,
          localStorageSize: entries.length,
          serviceWorkerSize: 0, // Would need to query service worker
          totalEntries: stats.memorySize + entries.length,
          hitRate: 0, // Would need to track hits/misses
          missRate: 0,
        });
      } catch (error) {
        console.error('Failed to load cache data:', error);
      }
    };
    loadData();
    }, [stats.memorySize]);

  const loadCacheData = async () => {
    try {
      // Load cache entries from localStorage
      const entries: CacheEntry[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache:')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            entries.push({
              key: key.replace('cache:', ''),
              size: new Blob([JSON.stringify(data)]).size,
              timestamp: data.timestamp || 0,
              ttl: data.ttl || 0,
              strategy: 'localStorage',
            });
          } catch {
            console.warn('Failed to parse cache entry:', key);
          }
        }
      }
      setCacheEntries(entries);

      // Calculate stats
      setCacheStats({
        memorySize: stats.memorySize,
        localStorageSize: entries.length,
        serviceWorkerSize: 0, // Would need to query service worker
        totalEntries: stats.memorySize + entries.length,
        hitRate: 0, // Would need to track hits/misses
        missRate: 0,
      });
    } catch (error) {
      console.error('Failed to load cache data:', error);
    }
  };

  const handleClearAllCaches = async () => {
    try {
      await clearCache();
      await clearServiceWorkerCache();
      await loadCacheData();
      refreshStats();
      refreshCacheSize();
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  };

  const handleWarmUpCache = async () => {
    try {
      await warmUpCache();
      await loadCacheData();
      refreshStats();
    } catch (error) {
      console.error('Failed to warm up cache:', error);
    }
  };

  const handleInvalidateCache = async (type: 'user' | 'resume') => {
    try {
      if (type === 'user') {
        await invalidateUserCache();
      } else {
        await invalidateResumeCache();
      }
      await loadCacheData();
      refreshStats();
    } catch (error) {
      console.error(`Failed to invalidate ${type} cache:`, error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const isExpired = (timestamp: number, ttl: number): boolean => {
    return Date.now() - timestamp > ttl;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 shadow-lg"
          title="Cache Manager"
        >
          <Database className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Cache Manager</h2>
            <div className="flex items-center ml-4">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="text-sm">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'entries', label: 'Cache Entries', icon: HardDrive },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'entries' | 'settings')}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Memory Cache</p>
                        <p className="text-2xl font-bold">{stats.memorySize}</p>
                        <p className="text-xs text-gray-500">entries</p>
                      </div>
                      <Database className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Local Storage</p>
                        <p className="text-2xl font-bold">{stats.localStorageSize}</p>
                        <p className="text-xs text-gray-500">entries</p>
                      </div>
                      <HardDrive className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Service Worker</p>
                        <p className="text-2xl font-bold">{cacheSize}</p>
                        <p className="text-xs text-gray-500">total size</p>
                      </div>
                      <Wifi className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Worker Status */}
              {registration && (
                <Card>
                  <CardHeader>
                    <CardTitle>Service Worker Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scope:</span>
                        <span className="font-medium">{registration.scope}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Update Available:</span>
                        <span className={`font-medium ${updateAvailable ? 'text-orange-600' : 'text-green-600'}`}>
                          {updateAvailable ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {updateAvailable && (
                        <Button onClick={updateServiceWorker} className="w-full mt-2">
                          Update Service Worker
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common cache management operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => handleInvalidateCache('user')} variant="outline">
                      Clear User Cache
                    </Button>
                    <Button onClick={() => handleInvalidateCache('resume')} variant="outline">
                      Clear Resume Cache
                    </Button>
                    <Button onClick={handleWarmUpCache} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Warm Up Cache
                    </Button>
                    <Button onClick={handleClearAllCaches} variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Caches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'entries' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Cache Entries</h3>
                <Button onClick={loadCacheData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-2">
                {cacheEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No cache entries found</p>
                ) : (
                  cacheEntries.map((entry, index) => (
                    <Card key={index} className={isExpired(entry.timestamp, entry.ttl) ? 'border-red-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">{entry.key}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Size: {formatBytes(entry.size)}</span>
                              <span>Strategy: {entry.strategy}</span>
                              <span>Cached: {formatTime(entry.timestamp)}</span>
                              {isExpired(entry.timestamp, entry.ttl) && (
                                <span className="text-red-500 font-medium">Expired</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              localStorage.removeItem(`cache:${entry.key}`);
                              loadCacheData();
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Configuration</CardTitle>
                  <CardDescription>
                    Configure cache behavior and strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Cache Strategy
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="memory">Memory Only</option>
                        <option value="localStorage">Local Storage</option>
                        <option value="serviceWorker">Service Worker</option>
                        <option value="hybrid">Hybrid (Memory + Local Storage)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default TTL (minutes)
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Memory Cache Size
                      </label>
                      <input
                        type="number"
                        defaultValue={100}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="compression" defaultChecked />
                      <label htmlFor="compression" className="text-sm text-gray-700">
                        Enable compression for large responses
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="debug" />
                      <label htmlFor="debug" className="text-sm text-gray-700">
                        Enable cache debugging
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Entries:</span>
                      <span className="font-medium">{cacheStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-medium">{cacheStats.memorySize} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Local Storage Usage:</span>
                      <span className="font-medium">{cacheStats.localStorageSize} entries</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Worker Cache:</span>
                      <span className="font-medium">{cacheSize}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 