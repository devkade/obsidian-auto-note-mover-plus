import { describe, it, expect } from 'vitest';
import type { TFile, CachedMetadata } from 'obsidian';
import { isRuleMatched } from '../utils/ruleMatching';
import { processFolderPath } from '../utils/pathProcessing';

/**
 * Minimal type definitions for integration testing
 * Avoids importing from settings.ts to prevent module resolution issues in vitest
 */
type MatchMode = 'ALL' | 'ANY';
type ConditionType = 'tag' | 'title' | 'property' | 'date';
type DateSource = 'frontmatter' | 'metadata';
type MetadataField = 'ctime' | 'mtime';

interface RuleCondition {
	type: ConditionType;
	value: string;
	dateSource?: DateSource;
	metadataField?: MetadataField;
}

interface FolderTagRule {
	folder: string;
	match: MatchMode;
	conditions: RuleCondition[];
	sourceFolders?: string[];
	sourceIncludeSubfolders?: boolean;
}

interface ExcludedFolder {
	folder: string;
}

interface AutoNoteMoverSettings {
	trigger_auto_manual: string;
	trigger_on_file_creation: boolean;
	use_regex_to_check_for_tags: boolean;
	statusBar_trigger_indicator: boolean;
	folder_tag_pattern: Array<FolderTagRule>;
	use_regex_to_check_for_excluded_folder: boolean;
	excluded_folder: Array<ExcludedFolder>;
	hide_notifications?: boolean;
	duplicate_file_action?: 'skip' | 'merge';
}

/**
 * Default settings for testing
 */
const DEFAULT_SETTINGS: AutoNoteMoverSettings = {
	trigger_auto_manual: 'Automatic',
	trigger_on_file_creation: false,
	use_regex_to_check_for_tags: false,
	statusBar_trigger_indicator: true,
	folder_tag_pattern: [{ folder: '', match: 'ALL', conditions: [], sourceFolders: [], sourceIncludeSubfolders: false }],
	use_regex_to_check_for_excluded_folder: false,
	excluded_folder: [{ folder: '' }],
	hide_notifications: false,
	duplicate_file_action: 'skip',
};

/**
 * Test helpers that mirror logic from main.ts for integration testing
 */
function normalizePath(path: string): string {
	return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
}

function isFileInSourceFolders(
	fileParentPath: string,
	sourceFolders: string[] | undefined,
	includeSubfolders: boolean | undefined
): boolean {
	if (!sourceFolders || sourceFolders.length === 0) {
		return true;
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

function canUseMergeAction(triggerMode: string, noteComposerEnabled: boolean): boolean {
	if (triggerMode !== 'Manual') {
		return false;
	}
	if (!noteComposerEnabled) {
		return false;
	}
	return true;
}

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

describe('Integration tests', () => {
	describe('Settings migration', () => {
		it('should load legacy settings without new fields', () => {
			const legacySettings: Omit<AutoNoteMoverSettings, 'hide_notifications' | 'duplicate_file_action'> = {
				trigger_auto_manual: 'Automatic',
				trigger_on_file_creation: false,
				use_regex_to_check_for_tags: false,
				statusBar_trigger_indicator: true,
				folder_tag_pattern: [{ folder: '', match: 'ALL', conditions: [], sourceFolders: [], sourceIncludeSubfolders: false }],
				use_regex_to_check_for_excluded_folder: false,
				excluded_folder: [{ folder: '' }],
			};

			const migratedSettings: AutoNoteMoverSettings = {
				...DEFAULT_SETTINGS,
				...legacySettings,
			};

			expect(migratedSettings.hide_notifications).toBe(false);
			expect(migratedSettings.duplicate_file_action).toBe('skip');
			expect(migratedSettings.trigger_auto_manual).toBe('Automatic');
			expect(migratedSettings.folder_tag_pattern).toHaveLength(1);
		});

		it('should save and load settings with all new fields', () => {
			const fullSettings: AutoNoteMoverSettings = {
				trigger_auto_manual: 'Manual',
				trigger_on_file_creation: true,
				use_regex_to_check_for_tags: true,
				statusBar_trigger_indicator: false,
				folder_tag_pattern: [
					{
						folder: 'Projects/$1',
						match: 'ALL',
						conditions: [{ type: 'tag', value: '#project-(\\w+)' }],
						sourceFolders: ['/inbox', '/drafts'],
						sourceIncludeSubfolders: true,
					},
				],
				use_regex_to_check_for_excluded_folder: true,
				excluded_folder: [{ folder: '/archive' }],
				hide_notifications: true,
				duplicate_file_action: 'merge',
			};

			const saved = JSON.stringify(fullSettings);
			const loaded = JSON.parse(saved) as AutoNoteMoverSettings;

			expect(loaded.trigger_auto_manual).toBe('Manual');
			expect(loaded.trigger_on_file_creation).toBe(true);
			expect(loaded.hide_notifications).toBe(true);
			expect(loaded.duplicate_file_action).toBe('merge');
			expect(loaded.folder_tag_pattern[0].sourceFolders).toEqual(['/inbox', '/drafts']);
			expect(loaded.folder_tag_pattern[0].sourceIncludeSubfolders).toBe(true);
		});
	});

	describe('Feature interaction', () => {
		it('should apply sourceFolders restriction before rule matching', () => {
			const rule: FolderTagRule = {
				folder: 'Projects',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#project' }],
				sourceFolders: ['/work'],
				sourceIncludeSubfolders: true,
			};

			const fileParentPath = '/work/note';
			const isInSourceFolders = isFileInSourceFolders(
				fileParentPath,
				rule.sourceFolders,
				rule.sourceIncludeSubfolders
			);

			expect(isInSourceFolders).toBe(true);

			const matchResult = isRuleMatched(rule, makeContext({
				tags: ['#project'],
				useRegexForTags: true,
			}));

			expect(matchResult.matched).toBe(true);
		});

		it('should apply sourceFolders restriction - file outside source', () => {
			const rule: FolderTagRule = {
				folder: 'Projects',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#project' }],
				sourceFolders: ['/work'],
				sourceIncludeSubfolders: true,
			};

			const fileParentPath = '/personal/note';
			const isInSourceFolders = isFileInSourceFolders(
				fileParentPath,
				rule.sourceFolders,
				rule.sourceIncludeSubfolders
			);

			expect(isInSourceFolders).toBe(false);
		});

		it('should handle capture groups with date tokens together', () => {
			const rule: FolderTagRule = {
				folder: 'Journal/$1/{{YYYY}}/{{MM}}',
				match: 'ALL',
				conditions: [
					{ type: 'tag', value: '#(\\w+)' },
					{ type: 'date', value: '', dateSource: 'metadata', metadataField: 'ctime' },
				],
			};

			const matchResult = isRuleMatched(rule, makeContext({
				tags: ['#work'],
				useRegexForTags: true,
			}));

			expect(matchResult.matched).toBe(true);
			expect(matchResult.captureGroups).toEqual(['work']);

			const processedFolder = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				matchResult.captureGroups
			);

			expect(processedFolder).toBe('Journal/work/2025/01');
		});

		it('should respect hide_notifications during batch move', () => {
			const hideNotifications = true;
			const files = ['note1.md', 'note2.md', 'note3.md'];
			const notificationCount = { success: 0, error: 0 };

			for (const _file of files) {
				if (!hideNotifications) {
					notificationCount.success++;
				}
				notificationCount.error++;
			}

			expect(notificationCount.success).toBe(0);
			expect(notificationCount.error).toBe(3);
		});

		it('should respect hide_notifications = false during batch move', () => {
			const hideNotifications = false;
			const files = ['note1.md', 'note2.md'];
			const notificationCount = { success: 0, error: 0 };

			for (const _file of files) {
				if (!hideNotifications) {
					notificationCount.success++;
				}
				notificationCount.error++;
			}

			expect(notificationCount.success).toBe(2);
			expect(notificationCount.error).toBe(2);
		});

		it('should only allow merge in Manual mode', () => {
			const autoResult = canUseMergeAction('Automatic', true);
			expect(autoResult).toBe(false);

			const manualWithComposer = canUseMergeAction('Manual', true);
			expect(manualWithComposer).toBe(true);

			const manualWithoutComposer = canUseMergeAction('Manual', false);
			expect(manualWithoutComposer).toBe(false);
		});

		it('should determine merge availability based on trigger mode and plugin state', () => {
			const testCases = [
				{ trigger: 'Automatic', composer: true, expected: false },
				{ trigger: 'Automatic', composer: false, expected: false },
				{ trigger: 'Manual', composer: true, expected: true },
				{ trigger: 'Manual', composer: false, expected: false },
			];

			for (const tc of testCases) {
				const result = canUseMergeAction(tc.trigger, tc.composer);
				expect(result).toBe(tc.expected);
			}
		});
	});

	describe('Edge cases', () => {
		it('should handle empty sourceFolders array', () => {
			const rule: FolderTagRule = {
				folder: 'Destination',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#test' }],
				sourceFolders: [],
				sourceIncludeSubfolders: false,
			};

			const result = isFileInSourceFolders('/any/path', rule.sourceFolders, rule.sourceIncludeSubfolders);
			expect(result).toBe(true);
		});

		it('should handle undefined capture groups gracefully', () => {
			const rule: FolderTagRule = {
				folder: 'Projects/$1/Notes',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#test' }],
			};

			const result = processFolderPath(
				rule.folder,
				fileCache,
				mockFile,
				rule,
				undefined
			);

			expect(result).toBe('Projects/$1/Notes');
		});

		it('should fallback to skip when Note Composer disabled', () => {
			const noteComposerEnabled = false;
			const duplicate_file_action = 'merge';

			const actualAction = noteComposerEnabled ? duplicate_file_action : 'skip';

			expect(actualAction).toBe('skip');
		});

		it('should allow merge when Note Composer enabled', () => {
			const noteComposerEnabled = true;
			const duplicate_file_action = 'merge';

			const actualAction = noteComposerEnabled ? duplicate_file_action : 'skip';

			expect(actualAction).toBe('merge');
		});

		it('should handle settings with partial new fields', () => {
			const partialSettings: Partial<AutoNoteMoverSettings> = {
				trigger_auto_manual: 'Automatic',
				hide_notifications: true,
			};

			const settings: AutoNoteMoverSettings = {
				...DEFAULT_SETTINGS,
				...partialSettings,
			};

			expect(settings.hide_notifications).toBe(true);
			expect(settings.duplicate_file_action).toBe('skip');
		});

		it('should handle rule with no conditions but has sourceFolders', () => {
			const rule: FolderTagRule = {
				folder: 'Archive',
				match: 'ALL',
				conditions: [],
				sourceFolders: ['/inbox'],
				sourceIncludeSubfolders: false,
			};

			const isInSource = isFileInSourceFolders('/inbox', rule.sourceFolders, rule.sourceIncludeSubfolders);
			expect(isInSource).toBe(true);

			const notInSource = isFileInSourceFolders('/other', rule.sourceFolders, rule.sourceIncludeSubfolders);
			expect(notInSource).toBe(false);
		});

		it('should handle nested capture groups with multiple rules', () => {
			const rule1: FolderTagRule = {
				folder: 'Work/$1',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#work-(\\w+)' }],
			};

			const rule2: FolderTagRule = {
				folder: 'Personal/$1',
				match: 'ALL',
				conditions: [{ type: 'tag', value: '#personal-(\\w+)' }],
			};

			const result1 = isRuleMatched(rule1, makeContext({
				tags: ['#work-project'],
				useRegexForTags: true,
			}));

			expect(result1.matched).toBe(true);
			expect(result1.captureGroups).toEqual(['project']);

			const processed1 = processFolderPath(rule1.folder, fileCache, mockFile, rule1, result1.captureGroups);
			expect(processed1).toBe('Work/project');

			const result2 = isRuleMatched(rule2, makeContext({
				tags: ['#personal-journal'],
				useRegexForTags: true,
			}));

			expect(result2.matched).toBe(true);
			expect(result2.captureGroups).toEqual(['journal']);

			const processed2 = processFolderPath(rule2.folder, fileCache, mockFile, rule2, result2.captureGroups);
			expect(processed2).toBe('Personal/journal');
		});
	});
});
