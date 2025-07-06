import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
      globals: {
        ...globals.node,
        Parse: 'readonly'
      }
    },
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      "linebreak-style": ["error", "unix"],
      "no-trailing-spaces": "error",
      "eol-last": "error",
      "space-in-parens": ["error", "never"],
      "no-multiple-empty-lines": "warn",
      "prefer-const": "error",
      "space-infix-ops": "error",
      "no-useless-escape": "off",
      "require-atomic-updates": "off",
      "object-curly-spacing": ["error", "always"],
      curly: ["error", "all"],
      "block-spacing": ["error", "always"],
      "no-unused-vars": "off",
      "no-console": "warn"
    },
  },
  {
    files: ['spec/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jasmine,
        Parse: 'readonly'
      }
    }
  }
];
