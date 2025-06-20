/**
 * Admin configuration and authorization utilities
 * Centralizes admin email management using environment variables
 */

// Get admin emails from environment variable
const getAdminEmails = (): string[] => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) {
    console.warn('ADMIN_EMAILS environment variable not set. No admin access will be granted.');
    return [];
  }
  
  return adminEmailsEnv.split(',').map(email => email.trim()).filter(email => email.length > 0);
};

// Cache admin emails to avoid repeated parsing
const ADMIN_EMAILS = getAdminEmails();

/**
 * Check if a user is an admin based on their email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * Check if a user is an admin based on database type or email
 */
export function isUserAdmin(user: { email?: string | null; type?: string | null }): boolean {
  // Check database admin type first
  if (user.type === 'admin') {
    return true;
  }
  
  // Check email-based admin access
  return isAdminEmail(user.email);
}

/**
 * Get list of admin emails (for debugging/logging purposes only)
 * Returns masked emails for security
 */
export function getAdminEmailsForLogging(): string[] {
  return ADMIN_EMAILS.map(email => {
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  });
} 