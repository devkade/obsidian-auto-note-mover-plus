import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';

export default tseslint.config(
	{
		ignores: [
			'*.js',
			'*.mjs',
			'node_modules/',
			'.research/',
			'main.js',
			// JSON files - not TypeScript
			'**/*.json',
			// Hidden directories
			'.bmad/',
			'.claude/',
			'.sisyphus/',
		],
	},
	...tseslint.configs.recommended,
	...obsidianmd.configs.recommended,
	// TypeScript files with type-aware linting
	{
		files: ['**/*.ts'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-prototype-builtins': 'off',
			'@typescript-eslint/no-empty-function': 'off',
			// Obsidian plugins run in browser environment, these are safe
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
	// Test files - relax some rules
	{
		files: ['tests/**/*.ts'],
		rules: {
			'obsidianmd/no-tfile-tfolder-cast': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
		},
	}
);
