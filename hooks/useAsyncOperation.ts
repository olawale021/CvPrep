import { useCallback, useState } from 'react';
import { useOperationLoading } from '../context/LoadingContext';

interface AsyncOperationOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  showGlobalLoading?: boolean;
  operationKey?: string;
  successMessage?: string;
  errorMessage?: string;
}

interface AsyncOperationState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  progress?: number;
}

export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    onSuccess,
    onError,
    showGlobalLoading = false,
    operationKey = 'default',
    successMessage,
    errorMessage
  } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    error: null,
    isLoading: false
  });

  const {
    startLoading,
    stopLoading,
    updateProgress,
    setError: setLoadingError
  } = useOperationLoading(showGlobalLoading ? 'critical' : operationKey);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      startLoading();

      const result = await operation(...args);

      setState(prev => ({ ...prev, data: result, isLoading: false }));
      stopLoading();

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({ ...prev, error: errorObj, isLoading: false }));
      setLoadingError(errorMessage || errorObj.message);

      if (onError) {
        onError(errorObj);
      }

      throw errorObj;
    }
  }, [operation, onSuccess, onError, startLoading, stopLoading, setLoadingError, errorMessage]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
    stopLoading();
  }, [stopLoading]);

  const setProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({ ...prev, progress }));
    updateProgress(progress, message);
  }, [updateProgress]);

  return {
    ...state,
    execute,
    reset,
    setProgress
  };
}

// Specialized hooks for common operations
export function useApiCall<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  return useAsyncOperation(apiCall, {
    ...options,
    operationKey: options.operationKey || 'api-call'
  });
}

export function useFileUpload(
  uploadFunction: (file: File, ...args: any[]) => Promise<any>,
  options: AsyncOperationOptions = {}
) {
  return useAsyncOperation(uploadFunction, {
    ...options,
    operationKey: options.operationKey || 'file-upload',
    showGlobalLoading: true
  });
}

export function useResumeOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  operationType: 'scoring' | 'optimizing' | 'generating' | 'analyzing',
  options: AsyncOperationOptions = {}
) {
  return useAsyncOperation(operation, {
    ...options,
    operationKey: options.operationKey || `resume-${operationType}`,
    showGlobalLoading: false
  });
} 