/**
 * Appends the single-use reset token to a base link as the `token` query
 * parameter, preserving any query the base already carries.
 *
 * Shared by the email sender (the public HTTPS link that goes in the message)
 * and the `/reset-password` handoff endpoint (the custom-scheme deep link it
 * opens), so both encode the token identically. The token is never logged.
 */
export function appendPasswordResetToken(
  baseUrl: string,
  token: string,
): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
}
