/**
 * The authenticated route the session E2E specs use as their "protected
 * request".
 *
 * The specs previously hit `/users/protec`, a throwaway probe that shipped in
 * the app and returned a fake secret. That route is gone; this is a real,
 * guarded endpoint (`GET /activities`) with a fixed calendar date, so it needs
 * no test state to succeed for a signed-in user.
 */
export const PROTECTED_PROBE = '/activities?today=2026-01-01';
