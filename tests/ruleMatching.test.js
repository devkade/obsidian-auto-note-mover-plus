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

// ANY match tests
test('ANY match returns true when at least one condition is true', () => {
	const rule = {
		match: 'ANY',
		conditions: [
			{ type: 'tag', value: '#testing' },
			{ type: 'tag', value: '#nonexistent' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('ANY match returns false when all conditions are false', () => {
	const rule = {
		match: 'ANY',
		conditions: [
			{ type: 'tag', value: '#nonexistent1' },
			{ type: 'tag', value: '#nonexistent2' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('ANY match ignores empty conditions', () => {
	const rule = {
		match: 'ANY',
		conditions: [
			{ type: 'tag', value: '' },
			{ type: 'tag', value: '#testing' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('ANY match with only empty conditions returns false', () => {
	const rule = {
		match: 'ANY',
		conditions: [
			{ type: 'tag', value: '' },
			{ type: 'tag', value: '   ' },
		],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

// Property condition tests
test('property condition with exact match', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'status=done' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('property condition with boolean value true', () => {
	const cache = {
		frontmatter: {
			published: true,
		},
	};

	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'published=true' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache: cache, fileName: 'note-title', tags: [], useRegexForTags: false }),
		true
	);
});

test('property condition with boolean value false', () => {
	const cache = {
		frontmatter: {
			archived: false,
		},
	};

	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'archived=false' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache: cache, fileName: 'note-title', tags: [], useRegexForTags: false }),
		true
	);
});

test('property condition with numeric value', () => {
	const cache = {
		frontmatter: {
			priority: 5,
		},
	};

	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'priority=5' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache: cache, fileName: 'note-title', tags: [], useRegexForTags: false }),
		true
	);
});

test('property condition returns false when property does not exist', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'nonexistent=value' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('property condition returns false when value does not match', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'status=todo' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('property condition with spaces in value', () => {
	const cache = {
		frontmatter: {
			category: 'work notes',
		},
	};

	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'category=work notes' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache: cache, fileName: 'note-title', tags: [], useRegexForTags: false }),
		true
	);
});

// Title pattern tests
test('title pattern matches with simple regex', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '^note-' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('title pattern does not match when pattern fails', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '^Meeting-' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('title pattern with case insensitive flag', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '/NOTE/i' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('title pattern with special characters escaped', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: 'note-title' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

test('title pattern with word boundary', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '\\btitle\\b' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		true
	);
});

// Tag regex tests
test('tag regex matches pattern', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: 'test.*' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: true }),
		true
	);
});

test('tag regex does not match when pattern fails', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: 'prod.*' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: true }),
		false
	);
});

test('tag regex with anchors', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: '^#testing$' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: true }),
		true
	);
});

test('tag regex matches multiple tags with OR pattern', () => {
	const multiTags = ['#project', '#work', '#important'];
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: '(project|personal)' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags: multiTags, useRegexForTags: true }),
		true
	);
});

// Negative test cases
test('invalid regex pattern returns false gracefully', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '[invalid(regex' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('undefined fileCache does not throw error', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'status=done' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache: undefined, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('empty tags array handles edge case', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: '#testing' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags: [], useRegexForTags: false }),
		false
	);
});

test('empty fileName does not throw error', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'title', value: '^note' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: '', tags, useRegexForTags: false }),
		false
	);
});

test('unknown condition type returns false', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'unknown', value: 'test' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('missing match field defaults to appropriate behavior', () => {
	const rule = {
		conditions: [{ type: 'tag', value: '#testing' }],
	};

	// Should handle missing match field gracefully
	const result = isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false });
	assert.equal(typeof result, 'boolean');
});

test('malformed property condition without equals sign', () => {
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'property', value: 'invalidformat' }],
	};

	assert.equal(
		isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false }),
		false
	);
});

test('very long condition value does not cause performance issue', () => {
	const longValue = 'a'.repeat(10000);
	const rule = {
		match: 'ALL',
		conditions: [{ type: 'tag', value: longValue }],
	};

	const start = Date.now();
	isRuleMatched(rule, { fileCache, fileName: 'note-title', tags, useRegexForTags: false });
	const duration = Date.now() - start;

	// Should complete in reasonable time (< 100ms)
	assert.ok(duration < 100);
});
