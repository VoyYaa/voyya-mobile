/**
 * ESLint raíz del repo standalone frontend-yavoy (móvil).
 * Regla dura del proyecto: prohibido `any` (heredada de coding-standards.md del monorepo VoyYa).
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'eslint-config-prettier',
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    '.turbo',
    '.expo',
    '**/*.js',
    '**/*.cjs',
  ],
  rules: {
    // Regla dura del proyecto.
    '@typescript-eslint/no-explicit-any': 'error',
    // Errores tipados; sin variables muertas (se permite prefijo _).
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
};
