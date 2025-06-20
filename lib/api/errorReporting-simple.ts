interface ErrorContext {
  userId?: string;
  userEmail?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  sessionId?: string;
  buildId?: string;
  environment?: string;
  [key: string]: unknown;
}

interface ErrorReport {
  message: string;
  stack?: string;
  name?: string;
  cause?: unknown;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'api' | 'ui' | 'auth' | 'payment' | 'ai' | 'upload' | 'general';
  fingerprint?: string;
}

interface ErrorReportingConfig {
  enabled: boolean;
  environment: string;
  apiEndpoint?: string;
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  maxLocalStorageEntries: number;
  enableBeacon: boolean;
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private sessionId: string;
  private buildId: string;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV || 'development',
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableLocalStorage: true,
      maxLocalStorageEntries: 100,
      enableBeacon: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'unknown';

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(event.reason, {
        category: 'general',
        severity: 'high',
        context: {
          type: 'unhandledrejection',
          url: window.location.href
        }
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        category: 'general',
        severity: 'high',
        context: {
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href
        }
      });
    });
  }

  private getCurrentUser(): { id: string; name?: string; email?: string } | null {
    try {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          return JSON.parse(userStr);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const message = error.message || 'Unknown error';
    const stack = error.stack?.split('\n')[0] || '';
    const url = context.url || '';
    
    return btoa(`${message}:${stack}:${url}`).replace(/[^a-zA-Z0-9]/g, '').substr(0, 32);
  }

  private async sendToAPI(report: ErrorReport): Promise<void> {
    if (!this.config.apiEndpoint) {
      throw new Error('Error reporting API endpoint not configured');
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to send error report to API`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send error report to API:', error);
      
      // Save to localStorage as backup but still throw the error
      this.saveToLocalStorage(report);
      
      // Don't silently fail - throw the error so calling code knows reporting failed
      throw new Error(`Error reporting failed: ${errorMessage}. Report saved locally as backup.`);
    }
  }

  private saveToLocalStorage(report: ErrorReport): void {
    if (!this.config.enableLocalStorage || typeof window === 'undefined') return;

    try {
      const key = 'cvprep_error_reports';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      existing.push(report);
      
      if (existing.length > this.config.maxLocalStorageEntries) {
        existing.splice(0, existing.length - this.config.maxLocalStorageEntries);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to save error report to localStorage:', error);
    }
  }

  private sendBeacon(report: ErrorReport): void {
    if (!this.config.enableBeacon || typeof navigator === 'undefined' || !navigator.sendBeacon) {
      throw new Error('Beacon API not available or not enabled');
    }
    if (!this.config.apiEndpoint) {
      throw new Error('Error reporting API endpoint not configured for beacon');
    }

    try {
      const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
      const success = navigator.sendBeacon(this.config.apiEndpoint, blob);
      
      if (!success) {
        throw new Error('Beacon send failed - browser rejected the request');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send error report via beacon:', error);
      
      // Don't silently fail - throw the error
      throw new Error(`Beacon error reporting failed: ${errorMessage}`);
    }
  }

  public async reportError(
    error: Error | string,
    options: {
      category?: ErrorReport['category'];
      severity?: ErrorReport['severity'];
      context?: Partial<ErrorContext>;
      fingerprint?: string;
    } = {}
  ): Promise<void> {
    if (!this.config.enabled) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const user = this.getCurrentUser();

    const context: ErrorContext = {
      userId: user?.id,
      userEmail: user?.email,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      buildId: this.buildId,
      environment: this.config.environment,
      ...options.context
    };

    const report: ErrorReport = {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
      cause: errorObj.cause,
      context,
      severity: options.severity || 'medium',
      category: options.category || 'general',
      fingerprint: options.fingerprint || this.generateFingerprint(errorObj, context)
    };

    // Console logging for development
    if (this.config.enableConsoleLogging) {
      console.group(`🚨 Error Report [${report.severity.toUpperCase()}]`);
      console.error('Error:', errorObj);
      console.log('Context:', context);
      console.log('Category:', report.category);
      console.groupEnd();
    }

    // Send to API endpoint
    if (this.config.apiEndpoint) {
      await this.sendToAPI(report);
    }

    // Save to local storage as backup
    this.saveToLocalStorage(report);

    // Send beacon for critical errors
    if (report.severity === 'critical') {
      this.sendBeacon(report);
    }
  }

  // Convenience methods for different error types
  public reportAPIError(error: Error, endpoint: string, statusCode?: number): Promise<void> {
    return this.reportError(error, {
      category: 'api',
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
      context: {
        endpoint,
        statusCode,
        type: 'api_error'
      }
    });
  }

  public reportUIError(error: Error, component: string): Promise<void> {
    return this.reportError(error, {
      category: 'ui',
      severity: 'medium',
      context: {
        component,
        type: 'ui_error'
      }
    });
  }

  public reportAuthError(error: Error, action: string): Promise<void> {
    return this.reportError(error, {
      category: 'auth',
      severity: 'high',
      context: {
        action,
        type: 'auth_error'
      }
    });
  }

  public reportAIError(error: Error, operation: string, model?: string): Promise<void> {
    return this.reportError(error, {
      category: 'ai',
      severity: 'high',
      context: {
        operation,
        model,
        type: 'ai_error'
      }
    });
  }

  public reportUploadError(error: Error, fileType?: string, fileSize?: number): Promise<void> {
    return this.reportError(error, {
      category: 'upload',
      severity: 'medium',
      context: {
        fileType,
        fileSize,
        type: 'upload_error'
      }
    });
  }

  // Get stored error reports
  public getStoredReports(): ErrorReport[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const reports = localStorage.getItem('cvprep_error_reports');
      return reports ? JSON.parse(reports) : [];
    } catch {
      return [];
    }
  }

  // Clear stored error reports
  public clearStoredReports(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('cvprep_error_reports');
    } catch (error) {
      console.warn('Failed to clear stored reports:', error);
    }
  }

  // Update user context
  public setUser(user: { id: string; name?: string; email?: string }): void {
    // Store user info for context
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('error_reporting_user', JSON.stringify(user));
      } catch {
        // Ignore storage errors
      }
    }
  }
}

// Create singleton instance
const errorReporting = new ErrorReportingService({
  enabled: process.env.NODE_ENV === 'production',
  apiEndpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT || '/api/errors/report',
});

export default errorReporting;
export { ErrorReportingService };
export type { ErrorContext, ErrorReport, ErrorReportingConfig };

