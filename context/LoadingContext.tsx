"use client";

import { createContext, ReactNode, useContext, useState } from 'react';

interface LoadingState {
  [key: string]: {
    isLoading: boolean;
    message?: string;
    progress?: number;
    error?: string;
  };
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  setError: (key: string, error: string) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  isAnyLoading: () => boolean;
  getLoadingState: (key: string) => LoadingState[string] | undefined;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean, message?: string, progress?: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: loading,
        message,
        progress,
        error: undefined
      }
    }));
  };

  const setError = (key: string, error: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error
      }
    }));
  };

  const clearLoading = (key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const clearAllLoading = () => {
    setLoadingStates({});
  };

  const isAnyLoading = () => {
    return Object.values(loadingStates).some(state => state.isLoading);
  };

  const getLoadingState = (key: string) => {
    return loadingStates[key];
  };

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      setLoading,
      setError,
      clearLoading,
      clearAllLoading,
      isAnyLoading,
      getLoadingState
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Convenience hook for specific loading operations
export function useOperationLoading(operationKey: string) {
  const { setLoading, setError, clearLoading, getLoadingState } = useLoading();
  
  const state = getLoadingState(operationKey);
  
  const startLoading = (message?: string, progress?: number) => {
    setLoading(operationKey, true, message, progress);
  };
  
  const stopLoading = () => {
    clearLoading(operationKey);
  };
  
  const updateProgress = (progress: number, message?: string) => {
    setLoading(operationKey, true, message, progress);
  };
  
  const setOperationError = (error: string) => {
    setError(operationKey, error);
  };
  
  return {
    isLoading: state?.isLoading || false,
    message: state?.message,
    progress: state?.progress,
    error: state?.error,
    startLoading,
    stopLoading,
    updateProgress,
    setError: setOperationError
  };
} 