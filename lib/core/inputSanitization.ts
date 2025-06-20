/**
 * Input sanitization and validation utilities
 * Provides functions to safely handle user input and prevent injection attacks
 */

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML characters to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from text
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize text input by removing HTML and escaping special characters
 */
export function sanitizeText(text: string): string {
  return escapeHtml(stripHtml(text.trim()));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate file upload
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions = ['.pdf', '.doc', '.docx', '.odt']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File extension not supported. Allowed extensions: ${allowedExtensions.join(', ')}`
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com)$/i,
    /\.(js|vbs|jar|app)$/i,
    /[<>:"|?*]/,
    /^\./,
    /\s+$/
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return {
        valid: false,
        error: 'File name contains invalid characters or suspicious extension'
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Validate and sanitize JSON input
 */
export function validateJsonInput(input: string, maxLength: number = 10000): { valid: boolean; data?: unknown; error?: string } {
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `Input too long. Maximum length is ${maxLength} characters.`
    };
  }

  try {
    const data = JSON.parse(input);
    return { valid: true, data };
  } catch {
    return {
      valid: false,
      error: 'Invalid JSON format'
    };
  }
}

/**
 * Rate limiting for input validation
 */
const validationAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkValidationRateLimit(identifier: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const attempts = validationAttempts.get(identifier);

  if (!attempts) {
    validationAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if window has passed
  if (now - attempts.lastAttempt > windowMs) {
    validationAttempts.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if rate limit exceeded
  if (attempts.count >= maxAttempts) {
    return false;
  }

  // Increment attempts
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
} 