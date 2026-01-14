import { describe, it, expect } from 'vitest';
import type { FolderTagRule } from '../settings/settings';

/**
 * Simple normalizePath implementation for testing
 * This mirrors the logic in obsidian's normalizePath
 */
function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
}

/**
 * Test helper to check if a file path is in the source folders
 * This mirrors the logic in main.ts fileCheck function
 */
function isFileInSourceFolders(
	fileParentPath: string,
	sourceFolders: string[] | undefined,
	includeSubfolders: boolean | undefined
): boolean {
	if (!sourceFolders || sourceFolders.length === 0) {
		return true; // No source folders restriction
	}

	for (const sourceFolder of sourceFolders) {
		if (!sourceFolder) continue;
		const normalizedSource = normalizePath(sourceFolder);

		if (includeSubfolders) {
			if (fileParentPath === normalizedSource || fileParentPath.startsWith(normalizedSource + '/')) {
				return true;
			}
		} else {
			if (fileParentPath === normalizedSource) {
				return true;
			}
		}
	}

	return false;
}

describe('sourceFolders feature', () => {
	describe('isFileInSourceFolders', () => {
		it('returns true when sourceFolders is undefined', () => {
			expect(isFileInSourceFolders('/notes', undefined, false)).toBe(true);
		});

		it('returns true when sourceFolders is empty array', () => {
			expect(isFileInSourceFolders('/notes', [], false)).toBe(true);
		});

		it('returns true when file is in exact source folder (no subfolders)', () => {
			expect(isFileInSourceFolders('/notes', ['/notes'], false)).toBe(true);
		});

		it('returns true when file is in exact source folder (with subfolders)', () => {
			expect(isFileInSourceFolders('/notes', ['/notes'], true)).toBe(true);
		});

		it('returns true when file is in subfolder (with subfolders enabled)', () => {
			expect(isFileInSourceFolders('/notes/subfolder', ['/notes'], true)).toBe(true);
		});

		it('returns true when file is in nested subfolder (with subfolders enabled)', () => {
			expect(isFileInSourceFolders('/notes/subfolder/nested', ['/notes'], true)).toBe(true);
		});

		it('returns false when file is in subfolder (with subfolders disabled)', () => {
			expect(isFileInSourceFolders('/notes/subfolder', ['/notes'], false)).toBe(false);
		});

		it('returns false when file is not in any source folder', () => {
			expect(isFileInSourceFolders('/other', ['/notes'], false)).toBe(false);
		});

		it('returns false when file is in different root folder', () => {
			expect(isFileInSourceFolders('/work/project', ['/personal'], true)).toBe(false);
		});

		it('matches multiple source folders (first match)', () => {
			expect(isFileInSourceFolders('/work', ['/personal', '/work'], false)).toBe(true);
		});

		it('matches multiple source folders (second match)', () => {
			expect(isFileInSourceFolders('/personal/diary', ['/work', '/personal'], true)).toBe(true);
		});

		it('returns false when file matches none of multiple source folders', () => {
			expect(isFileInSourceFolders('/archive', ['/work', '/personal'], false)).toBe(false);
		});

		it('ignores empty strings in sourceFolders array', () => {
			expect(isFileInSourceFolders('/notes', ['', '/notes'], false)).toBe(true);
		});

		it('handles folder paths without leading slash', () => {
			expect(isFileInSourceFolders('notes', ['notes'], false)).toBe(true);
		});

		it('handles folder paths with various formats', () => {
			expect(isFileInSourceFolders('/Users/notes', ['/Users/notes'], false)).toBe(true);
		});

		it('returns true when source folder is root', () => {
			expect(isFileInSourceFolders('/notes', ['/'], true)).toBe(true);
		});
	});

	describe('FolderTagRule interface', () => {
		it('allows sourceFolders as optional array', () => {
			const rule: FolderTagRule = {
				folder: '/destination',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#test' }],
				sourceFolders: ['/source'],
				sourceIncludeSubfolders: true,
			};

			expect(rule.sourceFolders).toEqual(['/source']);
			expect(rule.sourceIncludeSubfolders).toBe(true);
		});

		it('allows sourceFolders to be undefined', () => {
			const rule: FolderTagRule = {
				folder: '/destination',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#test' }],
			};

			expect(rule.sourceFolders).toBeUndefined();
		});

		it('allows empty sourceFolders array', () => {
			const rule: FolderTagRule = {
				folder: '/destination',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#test' }],
				sourceFolders: [],
			};

			expect(rule.sourceFolders).toEqual([]);
		});
	});
});
