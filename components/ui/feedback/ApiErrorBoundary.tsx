"use client";

import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';
import errorReporting from '../../../lib/api/errorReporting-simple';
import { Button } from '../base/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryAction?: () => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isRetrying: boolean;
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isRetrying: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Report API error to centralized error reporting
    const statusCode = this.extractStatusCode(error);
    errorReporting.reportAPIError(error, this.props.context || 'unknown', statusCode);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('ApiErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private extractStatusCode = (error: Error): number | undefined => {
    const message = error.message;
    const statusMatch = message.match(/(\d{3})/);
    return statusMatch ? parseInt(statusMatch[1]) : undefined;
  };

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      if (this.props.retryAction) {
        await this.props.retryAction();
      }
      
      // Reset error state after successful retry
      this.setState({ hasError: false, error: undefined, errorInfo: undefined, isRetrying: false });
    } catch {
      // If retry fails, keep error state but stop retrying
      this.setState({ isRetrying: false });
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isRetrying: false });
  };

  getErrorType = (error?: Error) => {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('unauthorized') || message.includes('403') || message.includes('401')) {
      return 'auth';
    }
    if (message.includes('500') || message.includes('server')) {
      return 'server';
    }
    
    return 'api';
  };

  getErrorMessage = (errorType: string, context?: string) => {
    const contextText = context ? ` ${context}` : '';
    
    switch (errorType) {
      case 'network':
        return `Network connection error${contextText}. Please check your internet connection and try again.`;
      case 'timeout':
        return `Request timeout${contextText}. The server is taking too long to respond.`;
      case 'auth':
        return `Authentication error${contextText}. Please log in again.`;
      case 'server':
        return `Server error${contextText}. Our servers are experiencing issues.`;
      case 'api':
        return `API error${contextText}. There was a problem processing your request.`;
      default:
        return `An unexpected error occurred${contextText}. Please try again.`;
    }
  };

  getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-8 h-8 text-red-600" />;
      case 'timeout':
        return <RefreshCw className="w-8 h-8 text-orange-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType, this.props.context);
      const errorIcon = this.getErrorIcon(errorType);

      // Default error UI
      return (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-lg border border-red-200 shadow-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                {errorIcon}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {errorType === 'network' ? 'Connection Problem' : 
               errorType === 'timeout' ? 'Request Timeout' :
               errorType === 'auth' ? 'Authentication Required' :
               errorType === 'server' ? 'Server Error' :
               'Something went wrong'}
            </h3>
            
            <p className="text-gray-600 mb-6 text-sm">
              {errorMessage}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs font-medium text-gray-600 mb-2">
                  Technical Details
                </summary>
                <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 overflow-auto max-h-24">
                  {this.state.error.message}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {this.props.retryAction && (
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex items-center justify-center"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="flex items-center justify-center"
                size="sm"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling API errors in functional components
export function useApiErrorHandler() {
  return (error: Error, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error in ${context || 'unknown context'}:`, error);
    }
    
    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { tags: { context } });
  };
} 