/**
 * Cryptographically secure token generation utilities
 */

/**
 * Generate a cryptographically secure random token
 * @param prefix Optional prefix for the token
 * @returns Secure random token string
 */
export const generateSecureToken = (prefix: string = 'token'): string => {
  // Use Web Crypto API for secure random generation
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Convert to hex string
  const randomHex = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Add timestamp for uniqueness and prefix for identification
  const timestamp = Date.now().toString(36);
  const random = randomHex.substring(0, 16);
  
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Generate a secure demo token that's still unpredictable
 * @returns Secure demo token
 */
export const generateDemoToken = (): string => {
  return generateSecureToken('demo');
};

/**
 * Validate token format (basic validation)
 * @param token Token to validate
 * @returns Boolean indicating if token format is valid
 */
export const isValidTokenFormat = (token: string): boolean => {
  // Token should have format: prefix_timestamp_random
  const tokenPattern = /^[a-z]+_[a-z0-9]+_[a-f0-9]{16}$/;
  return tokenPattern.test(token);
};

/**
 * Check if token is a demo token
 * @param token Token to check
 * @returns Boolean indicating if token is a demo token
 */
export const isDemoToken = (token: string): boolean => {
  return token.startsWith('demo_') && isValidTokenFormat(token);
};