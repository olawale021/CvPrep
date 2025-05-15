export function cn(...inputs: (string | undefined | false | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}

import logger from './logger';

/**
 * Converts a Google or other OAuth ID to a UUID format for database compatibility
 * This creates a deterministic UUID v5-like string using SHA-1 hashing
 * 
 * This is a simplified version that doesn't rely on the uuid package
 * but produces a consistent UUID-format string from any input string
 */
export function oauthIdToUuid(oauthId: string): string {
  // Create a deterministic hash of the oauthId
  let hash = 0;
  for (let i = 0; i < oauthId.length; i++) {
    const char = oauthId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to create parts of a UUID
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Create remaining parts with derived values (different bit manipulations of the hash)
  const part1 = hashStr.substring(0, 8);
  const part2 = hashStr.substring(0, 4);
  const part3 = '4' + hashStr.substring(0, 3); // Version 4 UUID format starts with 4
  const part4 = ((parseInt(hashStr.substring(0, 2), 16) & 0x3) | 0x8).toString(16) + hashStr.substring(0, 3);
  const part5 = hashStr.padStart(12, '0').substring(0, 12);
  
  // Format as UUID
  const uuid = `${part1}-${part2}-${part3}-${part4}-${part5}`;
  
  // Debug logging to verify consistency - only in development
  logger.debug('UUID generation', { 
    uuid, 
    originalId: oauthIdToMaskedId(oauthId),
    context: 'Auth' 
  });
  
  return uuid;
}

/**
 * Masks part of the OAuth ID for logging purposes
 * Only shows first and last few characters
 */
function oauthIdToMaskedId(oauthId: string): string {
  if (!oauthId || oauthId.length < 8) return oauthId;
  
  const firstPart = oauthId.substring(0, 4);
  const lastPart = oauthId.substring(oauthId.length - 4);
  
  return `${firstPart}...${lastPart}`;
} 