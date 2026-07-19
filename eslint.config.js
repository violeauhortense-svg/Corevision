import js from '@eslint/js';
import domainBoundaries from './.eslintrc-plugins/domain-boundaries.js';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '.vercel/**', 'graphify-out/**']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules
    }
  },
  {
    files: ['src/app/backend/**/*.{ts,tsx}'],
    plugins: {
      'domain-boundaries': domainBoundaries
    },
    rules: {
      'domain-boundaries/no-cross-domain-imports': 'error'
    }
  }
];
