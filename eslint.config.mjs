// @ts-check

import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json', './tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  globalIgnores(['dist/*', '.yarn/*', '.vscode/*', '.github/*']),
)
