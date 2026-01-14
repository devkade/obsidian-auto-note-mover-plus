import { MarkdownView, Plugin, TFile, getAllTags, Notice, TAbstractFile, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS, AutoNoteMoverSettings, AutoNoteMoverSettingTab, FolderTagRule, RuleCondition } from 'settings/settings';
import { fileMove, getTriggerIndicator, isFmDisable } from 'utils/Utils';
import { isRuleMatched } from 'utils/ruleMatching';
import { processFolderPath } from 'utils/pathProcessing';

export default class AutoNoteMover extends Plugin {
	settings: AutoNoteMoverSettings;
	private recentlyCreatedFiles: Set<string> = new Set();

	onload(): void {
		void this.initialize();
	}

	async initialize(): Promise<void> {
		await this.loadSettings();

		const fileCheck = async (file: TAbstractFile, oldPath?: string, caller?: string): Promise<boolean> => {
			const folderTagPattern = this.settings.folder_tag_pattern;
			const excludedFolder = this.settings.excluded_folder;
			if (this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd') {
				return false;
			}
			if (!(file instanceof TFile)) return false;

			// The rename event with no basename change will be terminated.
			if (oldPath && oldPath.split('/').pop() === file.basename + '.' + file.extension) {
				return false;
			}

			// Excluded Folder check
			const excludedFolderLength = excludedFolder.length;
			for (let i = 0; i < excludedFolderLength; i++) {
				if (
					!this.settings.use_regex_to_check_for_excluded_folder &&
					excludedFolder[i].folder &&
					file.parent.path === normalizePath(excludedFolder[i].folder)
				) {
					return false;
				} else if (this.settings.use_regex_to_check_for_excluded_folder && excludedFolder[i].folder) {
					try {
						const regex = new RegExp(excludedFolder[i].folder);
						if (regex.test(file.parent.path)) {
							return false;
						}
					} catch {
						if (file.parent.path.includes(excludedFolder[i].folder)) {
							return false;
						}
					}
				}
			}

			const fileCache = this.app.metadataCache.getFileCache(file);
			// Metadata can be undefined just after creation; wait for cache to resolve.
			if (!fileCache) return false;
			// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
			if (isFmDisable(fileCache)) {
				return false;
			}

			const fileName = file.basename;
			const fileFullName = file.basename + '.' + file.extension;
			const settingsLength = folderTagPattern.length;
			const cacheTag = getAllTags(fileCache) || [];

			for (let i = 0; i < settingsLength; i++) {
				const rule = folderTagPattern[i];

				// Source Folders check (rule-level restriction)
				const sourceFolders = rule.sourceFolders;
				if (sourceFolders && sourceFolders.length > 0) {
					const fileParentPath = file.parent.path;
					const includeSubfolders = rule.sourceIncludeSubfolders;
					let isInSourceFolder = false;

					for (const sourceFolder of sourceFolders) {
						if (!sourceFolder) continue;
						const normalizedSource = normalizePath(sourceFolder);

						if (includeSubfolders) {
							if (fileParentPath === normalizedSource || fileParentPath.startsWith(normalizedSource + '/')) {
								isInSourceFolder = true;
								break;
							}
						} else {
							if (fileParentPath === normalizedSource) {
								isInSourceFolder = true;
								break;
							}
						}
					}

					if (!isInSourceFolder) {
						continue;
					}
				}

				const matched = isRuleMatched(rule, {
					fileCache,
					fileName,
					tags: cacheTag,
					useRegexForTags: this.settings.use_regex_to_check_for_tags,
					file,
				});

				if (matched) {
					const processedFolder = processFolderPath(rule.folder, fileCache, file, rule);
					const originalPath = file.path;
					await fileMove(this.app, processedFolder, fileFullName, file, this.settings.hide_notifications, this.settings.duplicate_file_action, caller);
					// file.path updates after successful move
					return file.path !== originalPath;
				}
			}
			return false;
		};

		// Show trigger indicator on status bar
		let triggerIndicator: HTMLElement;
		const setIndicator = () => {
			if (!this.settings.statusBar_trigger_indicator) return;
			triggerIndicator.setText(getTriggerIndicator(this.settings.trigger_auto_manual));
		};
		if (this.settings.statusBar_trigger_indicator) {
			triggerIndicator = this.addStatusBarItem();
			setIndicator();
			// TODO: Is there a better way?
			this.registerDomEvent(window, 'change', setIndicator);
		}

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(this.app.vault.on('create', (file) => {
				if (!(file instanceof TFile)) return;
				this.recentlyCreatedFiles.add(file.path);
				setTimeout(() => {
					this.recentlyCreatedFiles.delete(file.path);
				}, 5000);
				if (this.settings.trigger_on_file_creation) {
					void fileCheck(file);
				}
			}));
			this.registerEvent(this.app.metadataCache.on('changed', (file) => {
				if (!this.settings.trigger_on_file_creation && this.recentlyCreatedFiles.has(file.path)) {
					return;
				}
				void fileCheck(file);
			}));
			this.registerEvent(this.app.vault.on('rename', (file, oldPath) => void fileCheck(file, oldPath)));
		});

		const moveNoteCommand = (view: MarkdownView) => {
			if (isFmDisable(this.app.metadataCache.getFileCache(view.file))) {
				new Notice('Auto Note Mover is disabled in the frontmatter.');
				return;
			}
			void fileCheck(view.file, undefined, 'cmd');
		};

		this.addCommand({
			id: 'Move-the-note',
			name: 'Move note',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						moveNoteCommand(markdownView);
					}
					return true;
				}
			},
		});

		this.addCommand({
			id: 'Move-all-notes',
			name: 'Move all notes matching rules',
			callback: async () => {
				const files = this.app.vault.getMarkdownFiles();
				let moved = 0;
				let processed = 0;
				const total = files.length;

				const progressNotice = new Notice(`Processing: 0/${total}`, 0);

				for (const file of files) {
					const wasMoved = await fileCheck(file, undefined, 'cmd');
					if (wasMoved) moved++;
					processed++;
					progressNotice.setMessage(`Processing: ${processed}/${total}`);
				}

				progressNotice.hide();
				new Notice(`Moved ${moved} notes (${total - moved} skipped)`);
			},
		});

		this.addCommand({
			id: 'Toggle-Auto-Manual',
			name: 'Toggle trigger',
			callback: () => {
				if (this.settings.trigger_auto_manual === 'Automatic') {
					this.settings.trigger_auto_manual = 'Manual';
					void this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is manual.');
				} else if (this.settings.trigger_auto_manual === 'Manual') {
					this.settings.trigger_auto_manual = 'Automatic';
					void this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is automatic.');
				}
				setIndicator();
			},
		});

		this.addSettingTab(new AutoNoteMoverSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings(): Promise<void> {
		const loaded = await this.loadData();
		const merged = Object.assign({}, DEFAULT_SETTINGS, loaded);
			if (merged.folder_tag_pattern) {
			merged.folder_tag_pattern = merged.folder_tag_pattern.map((rule: FolderTagRule) => {
				// Already in new shape
				if (rule.conditions) {
					const normalizedConds = rule.conditions || [];
					const hasDateCond = normalizedConds.some((c: RuleCondition) => c?.type === 'date');
					if (!hasDateCond && rule.date_property) {
						normalizedConds.push({ type: 'date', value: rule.date_property, dateSource: 'frontmatter', metadataField: 'ctime' });
					}
					return {
						folder: rule.folder || '',
						match: rule.match === 'ANY' ? 'ANY' : 'ALL',
						conditions: normalizedConds,
						date_property: rule.date_property || '',
						sourceFolders: rule.sourceFolders || [],
						sourceIncludeSubfolders: rule.sourceIncludeSubfolders || false,
					};
				}

				// Migrate legacy fields
				const conditions: RuleCondition[] = [];
				const legacyRule = rule as FolderTagRule & { tag?: string; pattern?: string; property?: string; property_value?: string };
				if (legacyRule.tag) conditions.push({ type: 'tag', value: legacyRule.tag });
				if (legacyRule.pattern) conditions.push({ type: 'title', value: legacyRule.pattern });
				if (legacyRule.property || legacyRule.property_value) {
					const pv = legacyRule.property_value ? `${legacyRule.property}=${legacyRule.property_value}` : legacyRule.property;
					if (pv) conditions.push({ type: 'property', value: pv });
				}
				if (rule.date_property) {
					conditions.push({ type: 'date', value: rule.date_property, dateSource: 'frontmatter', metadataField: 'ctime' });
				}

				return {
					folder: rule.folder || '',
					match: 'ALL' as const,
					conditions,
					date_property: rule.date_property || '',
					sourceFolders: [],
					sourceIncludeSubfolders: false,
				};
			});
		}

		this.settings = merged;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
