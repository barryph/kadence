/**
 * Runs before the test framework and before test files are imported.
 * Must set the React act environment flag early so RNTL's reconciler sees it.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
process.env.EXPO_PUBLIC_SERVER_URL = 'http://localhost:3000';
process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID =
  'test-web-client-id.apps.googleusercontent.com';
process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID =
  'test-ios-client-id.apps.googleusercontent.com';
