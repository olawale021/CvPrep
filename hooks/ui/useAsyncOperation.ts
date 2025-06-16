import { useCallback, useState } from 'react';
import { useOperationLoading } from '../../context/LoadingContext';

interface AsyncOperationOptions<T = unknown> {
  onSuccess?: (result: T) => void;
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

export function useAsyncOperation<T = unknown>(
  operation: (...args: unknown[]) => Promise<T>,
  options: AsyncOperationOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    showGlobalLoading = false,
    operationKey = 'default',
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

  const execute = useCallback(async (...args: unknown[]) => {
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
export function useApiCall<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<T>,
  options: AsyncOperationOptions<T> = {}
) {
  return useAsyncOperation(apiCall, {
    ...options,
    operationKey: options.operationKey || 'api-call'
  });
}

export function useFileUpload(
  uploadFunction: (file: File, ...args: unknown[]) => Promise<unknown>,
  options: AsyncOperationOptions = {}
) {
  const wrappedUploadFunction = (...args: unknown[]) => {
    const [file, ...restArgs] = args;
    return uploadFunction(file as File, ...restArgs);
  };

  return useAsyncOperation(wrappedUploadFunction, {
    ...options,
    operationKey: options.operationKey || 'file-upload',
    showGlobalLoading: true
  });
}

export function useResumeOperation<T = unknown>(
  operation: (...args: unknown[]) => Promise<T>,
  operationType: 'scoring' | 'optimizing' | 'generating' | 'analyzing',
  options: AsyncOperationOptions<T> = {}
) {
  return useAsyncOperation(operation, {
    ...options,
    operationKey: options.operationKey || `resume-${operationType}`,
    showGlobalLoading: false
  });
} 