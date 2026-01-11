import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['**/node_modules/**', '**/out/**', '**/dist/**', '**/coverage/**', '**/generated/**']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['packages/**/*.ts', 'packages/**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            }
        },
        rules: {
            '@typescript-eslint/explicit-function-return-type': [
                'warn',
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true
                }
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-console': [
                'error',
                {
                    allow: ['warn', 'error']
                }
            ],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-floating-promises': 'off'
        }
    },
    {
        files: ['packages/**/*.test.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn'
        }
    },
    {
        files: ['packages/cli/**/*.ts'],
        rules: {
            'no-console': 'off'        }
    }
];