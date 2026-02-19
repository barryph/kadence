// types/errors.ts
export interface ServerResponse<T = unknown> {
  data?: T;
  error?: ServerError;
}

export interface ServerError {
  code: string; // Unique error id
  message: string;
}

// All error codes across the app
// export enum ErrorCode {
//   // Auth errors
//   INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
//   ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
//   EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
//   TOO_MANY_ATTEMPTS = 'AUTH_TOO_MANY_ATTEMPTS',
//   EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_EXISTS',
//   WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
// }
export const ErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',

  // Generic errors
  GENERIC_ERROR: 'GENERIC_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
export type TErrorCode = typeof ErrorCode[keyof typeof ErrorCode]; // This type matches any value of the Error Code object
// Alternatively could define a union? type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface AppError {
  code: TErrorCode;
  message: string;
  // field?: string; // for field-specific errors
  // metadata?: Record<string, unknown>; // additional context
}

export type ApiResponse<T> =
  | { data: T, error?: never }
  | { error: AppError, data?: never };
