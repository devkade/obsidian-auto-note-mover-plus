import { describe, it, expect } from 'vitest';
import { isRuleMatched } from '../utils/ruleMatching';
import { processFolderPath } from '../utils/pathProcessing';
import type { FolderTagRule } from '../settings/settings';
import type { CachedMetadata, TFile } from 'obsidian';

const mockFile = {
	stat: {
		ctime: new Date('2025-01-15').getTime(),
		mtime: new Date('2025-01-15').getTime(),
	},
} as TFile;

const fileCache = {
	frontmatter: {
		created: '2025-01-15',
	},
} as CachedMetadata;

const makeContext = (overrides: {
	fileCache?: CachedMetadata | null | undefined;
	fileName?: string;
	tags?: string[];
	useRegexForTags?: boolean;
	file?: TFile;
} = {}): {
	fileCache: CachedMetadata | null | undefined;
	fileName: string;
	tags: string[];
	useRegexForTags: boolean;
	file: TFile;
} => ({
	fileCache,
	fileName: 'test-note',
	tags: [],
	useRegexForTags: false,
	file: mockFile,
	...overrides,
});

describe('Regex capture groups in folder path', () => {
	describe('isRuleMatched returns capture groups', () => {
		it('should return capture groups when regex matches', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(project|personal)-(\\w+)' }],
			};

			const result = isRuleMatched(rule, makeContext({
				tags: ['#project-alpha'],
				useRegexForTags: true,
			}));

			expect(result.matched).toBe(true);
			expect(result.captureGroups).toEqual(['project', 'alpha']);
		});

		it('should return first capture group only', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(\\w+)' }],
			};

			const result = isRuleMatched(rule, makeContext({
				tags: ['#testing'],
				useRegexForTags: true,
			}));

			expect(result.matched).toBe(true);
			expect(result.captureGroups).toEqual(['testing']);
		});

		it('should return undefined captureGroups when no match', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(nonexistent)' }],
			};

			const result = isRuleMatched(rule, makeContext({
				tags: ['#testing'],
				useRegexForTags: true,
			}));

			expect(result.matched).toBe(false);
			expect(result.captureGroups).toBeUndefined();
		});

		it('should return captureGroups for non-regex tag match', () => {
			const rule: FolderTagRule = {
				folder: '',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#testing' }],
			};

			const result = isRuleMatched(rule, makeContext({
				tags: ['#testing'],
				useRegexForTags: false,
			}));

			expect(result.matched).toBe(true);
			expect(result.captureGroups).toBeUndefined();
		});
	});

	describe('processFolderPath with capture groups', () => {
		it('should replace $1 with first capture group', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(project|personal)' }],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				['project']
			);

			expect(result).toBe('Projects/project');
		});

		it('should replace multiple capture groups ($1, $2)', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1/$2',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(\\w+)-(\\w+)' }],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				['project', 'alpha']
			);

			expect(result).toBe('Projects/project/alpha');
		});

		it('should leave $N unchanged if no capture group exists', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1',
				match: 'ALL',
				conditions: [],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				undefined
			);

			expect(result).toBe('Projects/$1');
		});

		it('should work alongside date tokens like {{YYYY}}', () => {
			const rule: FolderTagRule = {
				folder: 'Journal/$1/{{YYYY}}',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: '#(\\w+)' },
					{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'ctime' },
				],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				['work']
			);

			expect(result).toBe('Journal/work/2025');
		});

		it('should handle $10 and higher correctly', () => {
			const rule: FolderTagRule = {
				folder: 'Data/$1/$10',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(\\w+)' }],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				['test', 'extra1', 'extra2']
			);

			expect(result).toBe('Data/test/');
		});

		it('should not process capture groups when not provided', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1/Notes',
				match: 'ALL',
				conditions: [],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule
			);

			expect(result).toBe('Projects/$1/Notes');
		});

		it('should handle empty capture group array', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1',
				match: 'ALL',
				conditions: [],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				[]
			);

			expect(result).toBe('Projects/$1');
		});
	});

	describe('integration: isRuleMatched + processFolderPath', () => {
		it('should use capture groups from isRuleMatched in processFolderPath', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(\\w+)' }],
			};

			const matchResult = isRuleMatched(rule, makeContext({
				tags: ['#development'],
				useRegexForTags: true,
			}));

			expect(matchResult.matched).toBe(true);

			const processedFolder = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				matchResult.captureGroups
			);

			expect(processedFolder).toBe('Projects/development');
		});

		it('should handle complex folder path with multiple capture groups', () => {
			const rule: FolderTagRule = {
				folder: '$1/Projects/$2/$3',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#(\\w+)/(\\w+)' }],
			};

			const matchResult = isRuleMatched(rule, makeContext({
				tags: ['#work/important'],
				useRegexForTags: true,
			}));

			expect(matchResult.matched).toBe(true);
			expect(matchResult.captureGroups).toEqual(['work', 'important']);

			const processedFolder = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				matchResult.captureGroups
			);

			expect(processedFolder).toBe('work/Projects/important/');
		});

		it('should not process capture groups in non-regex mode', () => {
			const rule: FolderTagRule = {
				folder: 'Notes/$1',
				match: 'ALL',
				conditions: [{ type: 'tag', value: 'journal' }],
			};

			const matchResult = isRuleMatched(rule, makeContext({
				tags: ['#journal'],
				useRegexForTags: false,
			}));

			expect(matchResult.matched).toBe(true);
			expect(matchResult.captureGroups).toBeUndefined();

			const processedFolder = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				matchResult.captureGroups
			);

			expect(processedFolder).toBe('Notes/$1');
		});
	});
});
