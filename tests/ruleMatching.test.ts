import { describe, it, expect } from 'vitest';
import { isRuleMatched } from '../utils/ruleMatching';
import type { FolderTagRule, RuleCondition } from '../settings/settings';
import type { CachedMetadata, TFile } from 'obsidian';

const fileCache = {
	frontmatter: {
		created: '2025-01-01',
		status: 'done',
	},
} as CachedMetadata;

const mockFile = {
	stat: {
		ctime: new Date('2025-01-01').getTime(),
		mtime: new Date('2025-02-01').getTime(),
	},
} as TFile;

const tags = ['#testing'];

const makeContext = (overrides: Partial<{
	fileCache: CachedMetadata | null | undefined;
	fileName: string;
	tags: string[];
	useRegexForTags: boolean;
	file: TFile;
}> = {}) => ({
	fileCache,
	fileName: 'note-title',
	tags,
	useRegexForTags: false,
	file: mockFile,
	...overrides,
});

describe('isRuleMatched', () => {
	describe('ALL match mode', () => {
		it('ignores empty conditions while honoring filled ones', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: '#testing' },
					{ type: 'tag', value: '' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('rule with only empty conditions does not match', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: '   ' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('multiple populated conditions still match when all are true', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: '#testing' },
					{ type: 'property', value: 'status=done' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('tag match works when user omits leading hash', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: 'todo' },
				],
			};

			expect(isRuleMatched(rule, makeContext({ tags: ['#todo'] }))).toBe(true);
		});
	});

	describe('date conditions', () => {
		it('matches frontmatter key with valid date', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'date', value: 'created', dateSource: 'frontmatter' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('matches metadata mtime', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'mtime' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});
	});

	describe('ANY match mode', () => {
		it('returns true when at least one condition is true', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ANY',
				conditions: [
					{ type: 'tag', value: '#testing' },
					{ type: 'tag', value: '#nonexistent' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('returns false when all conditions are false', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ANY',
				conditions: [
					{ type: 'tag', value: '#nonexistent1' },
					{ type: 'tag', value: '#nonexistent2' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('ignores empty conditions', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ANY',
				conditions: [
					{ type: 'tag', value: '' },
					{ type: 'tag', value: '#testing' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('with only empty conditions returns false', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ANY',
				conditions: [
					{ type: 'tag', value: '' },
					{ type: 'tag', value: '   ' },
				],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});
	});

	describe('property conditions', () => {
		it('with exact match', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'status=done' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('with boolean value true', () => {
			const cache = {
				frontmatter: {
					published: true,
				},
			} as CachedMetadata;

			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'published=true' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileCache: cache, tags: [] }))).toBe(true);
		});

		it('with boolean value false', () => {
			const cache = {
				frontmatter: {
					archived: false,
				},
			} as CachedMetadata;

			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'archived=false' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileCache: cache, tags: [] }))).toBe(true);
		});

		it('with numeric value', () => {
			const cache = {
				frontmatter: {
					priority: 5,
				},
			} as CachedMetadata;

			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'priority=5' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileCache: cache, tags: [] }))).toBe(true);
		});

		it('returns false when property does not exist', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'nonexistent=value' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('returns false when value does not match', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'status=todo' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('with spaces in value', () => {
			const cache = {
				frontmatter: {
					category: 'work notes',
				},
			} as CachedMetadata;

			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'category=work notes' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileCache: cache, tags: [] }))).toBe(true);
		});
	});

	describe('title pattern conditions', () => {
		it('matches with simple regex', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '^note-' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('does not match when pattern fails', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '^Meeting-' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('with case insensitive flag', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '/NOTE/i' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('with special characters escaped', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: 'note-title' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});

		it('with word boundary', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '\\btitle\\b' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(true);
		});
	});

	describe('tag regex conditions', () => {
		it('matches pattern', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: 'test.*' }],
			};

			expect(isRuleMatched(rule, makeContext({ useRegexForTags: true }))).toBe(true);
		});

		it('does not match when pattern fails', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: 'prod.*' }],
			};

			expect(isRuleMatched(rule, makeContext({ useRegexForTags: true }))).toBe(false);
		});

		it('with anchors', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '^#testing$' }],
			};

			expect(isRuleMatched(rule, makeContext({ useRegexForTags: true }))).toBe(true);
		});

		it('matches multiple tags with OR pattern', () => {
			const multiTags = ['#project', '#work', '#important'];
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '(project|personal)' }],
			};

			expect(isRuleMatched(rule, makeContext({ tags: multiTags, useRegexForTags: true }))).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('invalid regex pattern returns false gracefully', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '[invalid(regex' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('undefined fileCache does not throw error', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'status=done' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileCache: undefined }))).toBe(false);
		});

		it('empty tags array handles edge case', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#testing' }],
			};

			expect(isRuleMatched(rule, makeContext({ tags: [] }))).toBe(false);
		});

		it('empty fileName does not throw error', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'title', value: '^note' }],
			};

			expect(isRuleMatched(rule, makeContext({ fileName: '' }))).toBe(false);
		});

		it('unknown condition type returns false', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'unknown' as RuleCondition['type'], value: 'test' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('missing match field defaults to appropriate behavior', () => {
			const rule = {
				folder: '',
				conditions: [{ type: 'tag', value: '#testing' }],
			} as FolderTagRule;

			const result = isRuleMatched(rule, makeContext());
			expect(typeof result).toBe('boolean');
		});

		it('malformed property condition without equals sign', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'property', value: 'invalidformat' }],
			};

			expect(isRuleMatched(rule, makeContext())).toBe(false);
		});

		it('very long condition value does not cause performance issue', () => {
			const longValue = 'a'.repeat(10000);
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: longValue }],
			};

			const start = Date.now();
			isRuleMatched(rule, makeContext());
			const duration = Date.now() - start;

			expect(duration).toBeLessThan(100);
		});
	});
});
