// @ts-nocheck
const test = require('node:test');
const assert = require('node:assert/strict');
const { processFolderPath } = require('../utils/pathProcessing');

const fileCache = {
	frontmatter: {
		date: '2025-01-01',
		title: 'My Note',
	},
};

const mockFile = {
	stat: {
		ctime: new Date('2025-01-01T10:00:00Z').getTime(),
		mtime: new Date('2025-02-01T10:00:00Z').getTime(),
	},
};

test('returns folder path as is if no tokens present', () => {
	const folder = 'MyFolder/Subfolder';
	const result = processFolderPath(folder, fileCache, mockFile, {});
	assert.equal(result, folder);
});

test('replaces tokens using frontmatter date', () => {
	const folder = 'Journal/{{YYYY}}/{{MM}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'Journal/2025/01');
});

test('replaces tokens using metadata ctime', () => {
	const folder = 'Archive/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'ctime' }],
	};
	// ctime is 2025-01-01
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'Archive/2025');
});

test('replaces tokens using metadata mtime', () => {
	const folder = 'Updates/{{YYYY}}-{{MM}}';
	const rule = {
		conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'mtime' }],
	};
	// mtime is 2025-02-01
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'Updates/2025-02');
});

test('falls back to literal path if frontmatter key missing', () => {
	const folder = 'Journal/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: 'missing_date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, folder);
});

test('falls back to literal path if date invalid', () => {
	const invalidCache = { frontmatter: { date: 'invalid-date' } };
	const folder = 'Journal/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, invalidCache, mockFile, rule);
	assert.equal(result, folder);
});

test('supports legacy date_property in rule root', () => {
	const folder = 'Legacy/{{YYYY}}';
	const rule = {
		date_property: 'date',
		conditions: [], // empty or no date condition
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'Legacy/2025');
});

test('handles multiple tokens in path', () => {
	const folder = '{{YYYY}}/{{MM}}/{{DD}}/Notes';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, '2025/01/01/Notes');
});

test('handles all supported date tokens', () => {
	const folder = '{{YYYY}}-{{MM}}-{{DD}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, '2025-01-01');
});

test('handles empty frontmatter', () => {
	const emptyCache = { frontmatter: {} };
	const folder = 'Archive/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, emptyCache, mockFile, rule);
	assert.equal(result, folder);
});

test('handles null frontmatter', () => {
	const nullCache = { frontmatter: null };
	const folder = 'Archive/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, nullCache, mockFile, rule);
	assert.equal(result, folder);
});

test('handles path with trailing slash', () => {
	const folder = 'MyFolder/{{YYYY}}/';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'MyFolder/2025/');
});

test('handles path with special characters', () => {
	const folder = 'My-Folder_2025/Notes (Archive)/{{YYYY}}';
	const rule = {
		conditions: [{ type: 'date', value: 'date', dateSource: 'frontmatter' }],
	};
	const result = processFolderPath(folder, fileCache, mockFile, rule);
	assert.equal(result, 'My-Folder_2025/Notes (Archive)/2025');
});
