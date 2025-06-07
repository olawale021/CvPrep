/**
 * Secure logging utility for the CvPrep application
 * - Implements different logging levels
 * - Prevents sensitive data logging in production
 * - Provides consistent formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  // Mask sensitive fields in objects when logging
  maskFields?: string[];
  // Additional context for the log
  context?: string;
}

// Only show debug and info logs in development
const isDevelopment = process.env.NODE_ENV === 'development';

// Check if auth logging is explicitly disabled
const isAuthLoggingDisabled = process.env.DISABLE_AUTH_LOGS === 'true';

// Patterns to detect and mask in all logs (URLs, paths, params)
const SENSITIVE_URL_PATTERNS = [
  // OAuth and auth-related URLs - more specific patterns first
  /GET\s+\/api\/auth\/callback\/google(\?[^\s]+)?/gi,
  /\/api\/auth\/callback\/google(\?[^\s]+)?/gi,
  /\/auth\/callback\/google(\?[^\s]+)?/gi,
  // General OAuth patterns
  /\/api\/auth\/callback\/[^/\s?]+(\?[^/\s]+)?/gi,
  /\/auth\/callback\/[^/\s?]+(\?[^/\s]+)?/gi,
  // OAuth URL parameters
  /code=[^&\s]+/gi,
  /token=[^&\s]+/gi, 
  /state=[^&\s]+/gi,
  /session=[^&\s]+/gi,
  /nonce=[^&\s]+/gi,
  // API keys and tokens in URLs
  /key=[^&\s]+/gi,
  /apikey=[^&\s]+/gi,
  /api_key=[^&\s]+/gi,
  /secret=[^&\s]+/gi,
  /access_token=[^&\s]+/gi,
  /refresh_token=[^&\s]+/gi,
  // OAuth HTTP requests
  /GET\s+\/api\/auth\/[^\s]+/gi,
  /POST\s+\/api\/auth\/[^\s]+/gi
];

/**
 * Securely mask sensitive fields in objects
 */
function maskSensitiveData(data: unknown, maskFields: string[] = []): unknown {
  // Default sensitive fields to always mask
  const defaultSensitiveFields = [
    'password', 'token', 'secret', 'key', 'apiKey', 'authorization',
    'accessToken', 'refreshToken', 'jwt', 'session', 'code', 'state',
    'id_token', 'auth_token', 'credential'
  ];
  
  const allFieldsToMask = [...defaultSensitiveFields, ...maskFields];
  
  if (typeof data !== 'object' || data === null) {
    return maskSensitiveStrings(data);
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, allFieldsToMask));
  }
  
  // Handle objects
  const maskedData = { ...data as Record<string, unknown> };
  
  for (const key in maskedData) {
    // Check if this key should be masked
    if (allFieldsToMask.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      maskedData[key] = '[REDACTED]';
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      // Recursively mask nested objects
      maskedData[key] = maskSensitiveData(maskedData[key], allFieldsToMask);
    } else if (typeof maskedData[key] === 'string') {
      // Check strings for sensitive URL patterns even in non-sensitive fields
      maskedData[key] = maskSensitiveStrings(maskedData[key]);
    }
  }
  
  return maskedData;
}

/**
 * Mask sensitive information in string values like URLs
 */
function maskSensitiveStrings(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  
  let result = value;
  
  // Special case handling for Google OAuth callback URLs
  if (result.includes('/api/auth/callback/google') || 
      result.includes('/auth/callback/google') ||
      result.includes('GET /api/auth/callback/google')) {
    // Completely mask Google OAuth callbacks which may contain sensitive tokens
    return '[OAUTH CALLBACK REDACTED]';
  }
  
  // Replace sensitive URL patterns
  SENSITIVE_URL_PATTERNS.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // For complete auth callback URLs, replace entire URL
      if (match.includes('/api/auth/callback') || match.includes('/auth/callback')) {
        return '[AUTH CALLBACK REDACTED]';
      }
      
      // For HTTP requests to auth endpoints
      if (match.startsWith('GET ') || match.startsWith('POST ')) {
        return '[AUTH REQUEST REDACTED]';
      }
      
      // For URL parameters, just mask the values
      if (match.includes('=')) {
        const parts = match.split('=');
        return `${parts[0]}=[REDACTED]`;
      }
      
      return '[REDACTED]';
    });
  });
  
  return result;
}

/**
 * Filter function to determine if a log should be suppressed based on content
 */
function shouldSuppressLog(message: string, data?: unknown): boolean {
  // Don't log anything if auth logging is explicitly disabled
  if (isAuthLoggingDisabled) {
    // Check if message contains auth-related keywords
    if (
      message.includes('/api/auth') || 
      message.includes('/auth/callback') ||
      message.includes('GET /api/auth') ||
      message.includes('POST /api/auth') ||
      message.includes('callback/google')
    ) {
      return true;
    }
    
    // Check data for auth-related paths
    if (data && typeof data === 'object' && data !== null) {
      const dataStr = JSON.stringify(data);
      if (
        dataStr.includes('/api/auth') || 
        dataStr.includes('/auth/callback') ||
        dataStr.includes('GET /api/auth') ||
        dataStr.includes('POST /api/auth')
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Main logger function that handles all log levels
 */
function logMessage(level: LogLevel, message: string, data?: unknown, options: LogOptions = {}): void {
  // In production, don't show debug or info logs
  if (!isDevelopment && (level === 'debug' || level === 'info')) {
    return;
  }
  
  // Check if this log should be completely suppressed (auth-related)
  if (shouldSuppressLog(message, data)) {
    return;
  }
  
  // Format the log message
  const timestamp = new Date().toISOString();
  const context = options.context ? `[${options.context}]` : '';
  
  // Mask sensitive data in the message itself
  const safeMessage = maskSensitiveStrings(message) as string;
  const formattedMessage = `${timestamp} ${level.toUpperCase()} ${context} ${safeMessage}`;
  
  // Handle data objects if provided
  let processedData: unknown = undefined;
  if (data !== undefined) {
    processedData = maskSensitiveData(data, options.maskFields);
  }
  
  // Use the appropriate console method
  switch (level) {
    case 'debug':
      if (isDevelopment) {
        if (processedData !== undefined) {
          console.debug(formattedMessage, processedData);
        } else {
          console.debug(formattedMessage);
        }
      }
      break;
    case 'info':
      if (isDevelopment) {
        if (processedData !== undefined) {
          console.info(formattedMessage, processedData);
        } else {
          console.info(formattedMessage);
        }
      }
      break;
    case 'warn':
      if (processedData !== undefined) {
        console.warn(formattedMessage, processedData);
      } else {
        console.warn(formattedMessage);
      }
      break;
    case 'error':
      if (processedData !== undefined) {
        console.error(formattedMessage, processedData);
      } else {
        console.error(formattedMessage);
      }
      break;
  }
}

// Export individual log level functions
export const logger = {
  debug: (message: string, data?: unknown, options: LogOptions = {}): void => 
    logMessage('debug', message, data, options),
    
  info: (message: string, data?: unknown, options: LogOptions = {}): void => 
    logMessage('info', message, data, options),
    
  warn: (message: string, data?: unknown, options: LogOptions = {}): void => 
    logMessage('warn', message, data, options),
    
  error: (message: string, data?: unknown, options: LogOptions = {}): void => 
    logMessage('error', message, data, options)
};

export default logger; 