// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'dist/*',
      // Generated, not source: expo prebuild output, Expo's type shim and its
      // cache. They are gitignored and would otherwise be linted by `eslint .`.
      'android/*',
      'ios/*',
      '.expo/*',
      'expo-env.d.ts',
    ],
  },
]);
