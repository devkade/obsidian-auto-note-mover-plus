import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		globals: true,
		alias: {
			obsidian: '/Users/kade/opensource/obsidian-auto-note-mover/__mocks__/obsidian.ts',
		},
	},
});
