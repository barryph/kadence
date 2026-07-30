/**
 * Runs before the test framework and before test files are imported.
 * Must set the React act environment flag early so RNTL's reconciler sees it.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
process.env.EXPO_PUBLIC_SERVER_URL = 'http://localhost:3000';
