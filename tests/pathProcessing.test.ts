import { describe, it, expect } from 'vitest';
import { processFolderPath } from '../utils/pathProcessing';
import type { FolderTagRule } from '../settings/settings';
import type { CachedMetadata, TFile } from 'obsidian';

const fileCache = {
	frontmatter: {
		date: '2025-01-01',
		title: 'My Note',
	},
} as CachedMetadata;

const mockFile = {
	stat: {
		ctime: new Date('2025-01-01T10:00:00Z').getTime(),
		mtime: new Date('2025-02-01T10:00:00Z').getTime(),
	},
} as TFile;

describe('processFolderPath', () => {
	it('returns folder path as is if no tokens present', () => {
		const folder = 'MyFolder/Subfolder';
		const rule = { conditions: [] } as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe(folder);
	});

	it('replaces tokens using frontmatter date', () => {
		const folder = 'Journal/{{YYYY}}/{{MM}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('Journal/2025/01');
	});

	it('replaces tokens using metadata ctime', () => {
		const folder = 'Archive/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'ctime' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('Archive/2025');
	});

	it('replaces tokens using metadata mtime', () => {
		const folder = 'Updates/{{YYYY}}-{{MM}}';
		const rule = {
			conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'mtime' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('Updates/2025-02');
	});

	it('falls back to literal path if frontmatter key missing', () => {
		const folder = 'Journal/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: 'missing_date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe(folder);
	});

	it('falls back to literal path if date invalid', () => {
		const invalidCache = { frontmatter: { date: 'invalid-date' } } as CachedMetadata;
		const folder = 'Journal/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, invalidCache, mockFile, rule);
		expect(result).toBe(folder);
	});

	it('supports legacy date_property in rule root', () => {
		const folder = 'Legacy/{{YYYY}}';
		const rule = {
			date_property: 'date',
			conditions: [],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('Legacy/2025');
	});

	it('handles multiple tokens in path', () => {
		const folder = '{{YYYY}}/{{MM}}/{{DD}}/Notes';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('2025/01/01/Notes');
	});

	it('handles all supported date tokens', () => {
		const folder = '{{YYYY}}-{{MM}}-{{DD}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('2025-01-01');
	});

	it('handles empty frontmatter', () => {
		const emptyCache = { frontmatter: {} } as CachedMetadata;
		const folder = 'Archive/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, emptyCache, mockFile, rule);
		expect(result).toBe(folder);
	});

	it('handles null frontmatter', () => {
		const nullCache = { frontmatter: null } as unknown as CachedMetadata;
		const folder = 'Archive/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, nullCache, mockFile, rule);
		expect(result).toBe(folder);
	});

	it('handles path with trailing slash', () => {
		const folder = 'MyFolder/{{YYYY}}/';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('MyFolder/2025/');
	});

	it('handles path with special characters', () => {
		const folder = 'My-Folder_2025/Notes (Archive)/{{YYYY}}';
		const rule = {
			conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
		} as FolderTagRule;
		const result = processFolderPath(folder, fileCache, mockFile, rule);
		expect(result).toBe('My-Folder_2025/Notes (Archive)/2025');
	});
});
