// Backend-scoped ESLint config. The frontend (app.js, study.js, course data
// files) is intentionally not linted yet — it would surface a lot of stylistic
// noise that's better cleaned up incrementally as those files are touched.

const js = require('@eslint/js');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'expansions.js',
      'expansions/**',
      'extras.js',
      'english-extras.js',
      '*-data.js',
      'app.js',
      'auth.js',
      'ai.js',
      'study.js',
      'courses.js',
      'gamification.js',
      'parent.js',
      'admin.js',
      'profile.js',
      'activity.js',
      'favorites.js',
      'curriculum.js',
      'activity-labels.js',
      'survey.js',
      'tokens.js',
      'payments.js',
      'data.json',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        exports: 'writable',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
];
