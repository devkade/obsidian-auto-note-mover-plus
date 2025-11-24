const test = require('node:test');
const assert = require('node:assert/strict');

const { isRuleMatched } = require('../utils/ruleMatching');

const fileCache = {
	frontmatter: {
		created: '2025-01-01',
		status: 'done',
	},
};

const mockFile = {
	stat: {
		ctime: new Date('2025-01-01').getTime(),
		mtime: new Date('2025-02-01').getTime(),
	},
};

const tags = ['#testing'];

test('ALL match ignores empty conditions while honoring filled ones', () => {
	const rule = {
		match: 'ALL',
		conditions: [
			{ type: 'tag', value: '#testing' },
			{ type: 'tag', value: '' }, // should be ignored
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('rule with only empty conditions does not match', () => {
	const rule = {
		match: 'ALL',
		conditions: [
			{ type: 'tag', value: '   ' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('multiple populated conditions still match when all are true', () => {
	const rule = {
		match: 'ALL',
		conditions: [
			{ type: 'tag', value: '#testing' },
			{ type: 'property', value: 'status=done' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('tag match works when user omits leading hash', () => {
	const rule = {
		match: 'ALL',
		conditions: [
			{ type: 'tag', value: 'todo' },
		],
	};

	const context = {
		fileCache,
		fileName: 'note-title',
		tags: ['#todo'],
		useRegexForTags: false,
	};

	assert.equal(isRuleMatched(rule, context), true);
});

test('date condition matches frontmatter key with valid date', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'date', value: 'created', dateSource: 'frontmatter' }],
	};

	const context = { fileCache, fileName: 'note-title', tags, useRegexForTags: false };
	assert.equal(isRuleMatched(rule, context), true);
});

test('date condition matches metadata mtime', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'mtime' }],
	};

	const context = { fileCache, fileName: 'note-title', tags, useRegexForTags: false, file: mockFile };
	assert.equal(isRuleMatched(rule, context), true);
});
