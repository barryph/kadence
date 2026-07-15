// Tokens expire in 20 minutes
export const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 20;
export const PASSWORD_RESET_TOKEN_EXPIRY_MS =
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000;

// 20 bytes produces a 40-character hex token (160 bits of entropy)
export const PASSWORD_RESET_TOKEN_BYTES = 20;

// Limit forgot-password requests per IP
export const FORGOT_PASSWORD_RATE_LIMIT_MAX = 5;
// 15-minute sliding window for forgot-password rate limiting
export const FORGOT_PASSWORD_RATE_LIMIT_TTL_MS = 15 * 60 * 1000;
