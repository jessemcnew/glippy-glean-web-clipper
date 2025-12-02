 // ESLint configuration for Glean Web Clipper Chrome Extension
 // Using ESLint v9+ flat config format

 import js from '@eslint/js';
 import importPlugin from 'eslint-plugin-import';
 import jsdocPlugin from 'eslint-plugin-jsdoc';

 export default [
   // Base recommended configuration
   js.configs.recommended,

   // Global configuration for all files
   {
     languageOptions: {
       ecmaVersion: 2022,
       sourceType: 'module',
       globals: {
         chrome: 'readonly',
         browser: 'readonly',
         console: 'readonly'
       }
     },

     plugins: {
       import: importPlugin,
       jsdoc: jsdocPlugin
     },

     rules: {
       // Import/Export rules
       'import/order': ['error', {
         'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
         'newlines-between': 'always'
       }],
       'import/extensions': ['error', 'always', { 'ignorePackages': true }],

       // Code quality rules
       'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
       'no-console': 'off',
       'prefer-const': 'error',
       'no-var': 'error',
       'eqeqeq': ['error', 'always'],
       'curly': ['error', 'all'],
       'no-undef': 'error',
       'no-implicit-globals': 'error'
     }
   },

   // Background scripts and service workers
   {
     files: ['background.js', 'modules/**/*.js'],
     languageOptions: {
       globals: {
         chrome: 'readonly',
         console: 'readonly',
         // Remove DOM globals for service workers
         document: 'off',
         window: 'off'
       }
     },
     rules: {
       'no-restricted-globals': ['error', 'window', 'document']
     }
   },

   // Content scripts and popup scripts
   {
     files: ['content.js', 'popup.js', 'collections-api.js'],
     languageOptions: {
       globals: {
         chrome: 'readonly',
         browser: 'readonly',
         console: 'readonly',
         document: 'readonly',
         window: 'readonly'
       }
     }
   },

   // Configuration files
   {
     files: ['eslint.config.mjs', '*.config.js'],
     languageOptions: {
       sourceType: 'module',
       globals: {
         process: 'readonly',
         console: 'readonly'
       }
     }
   },

   // Ignore patterns (replaces .eslintignore)
   {
     ignores: [
       'node_modules/',
       'dist/',
       'build/',
       '*.min.js',
       '*.bundle.js',
       'archive/',
       '*.backup',
       '*.bak',
       'coverage/',
       '*.log',
       'package-lock.json',
       'yarn.lock',
       'pnpm-lock.yaml'
     ]
   }
 ];
