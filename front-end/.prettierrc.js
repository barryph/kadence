module.exports = {
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  overrides: [
    {
      // Messes with code block spacing
      // Default length of github tabs is 8, too large to when previewing a READEME.md
      files: 'README.md',
      options: {
        useTabs: false,
      },
    },
  ],
};
