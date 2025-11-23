import { MarkdownView, Plugin, TFile, getAllTags, Notice, TAbstractFile, normalizePath, parseFrontMatterEntry, CachedMetadata } from 'obsidian';
import { DEFAULT_SETTINGS, AutoNoteMoverSettings, AutoNoteMoverSettingTab } from 'settings/settings';
import { fileMove, getTriggerIndicator, isFmDisable, createFolderIfNotExists } from 'utils/Utils';

export default class AutoNoteMover extends Plugin {
	settings: AutoNoteMoverSettings;

	async onload() {
		await this.loadSettings();
		const folderTagPattern = this.settings.folder_tag_pattern;
		const excludedFolder = this.settings.excluded_folder;

		const processFolderPath = (folderPath: string, fileCache: CachedMetadata, dateProperty?: string): string => {
			// Detect tokens using regex
			const tokenPattern = /\{\{(.+?)\}\}/g;
			const hasTokens = tokenPattern.test(folderPath);

			// Return literal path if no tokens found
			if (!hasTokens) {
				return folderPath;
			}

			// Return literal path if tokens found but no date_property specified
			if (!dateProperty) {
				return folderPath;
			}

			// Read date value from frontmatter
			const dateValue = parseFrontMatterEntry(fileCache?.frontmatter, dateProperty);
			if (dateValue === undefined || dateValue === null) {
				console.warn(`[Auto Note Mover] Date property "${dateProperty}" not found in frontmatter. Using literal path.`);
				return folderPath;
			}

			// Parse date with window.moment
			const momentDate = (window as any).moment(dateValue);
			if (!momentDate.isValid()) {
				console.warn(`[Auto Note Mover] Invalid date value "${dateValue}" for property "${dateProperty}". Using literal path.`);
				return folderPath;
			}

			// Replace tokens using moment formatting
			tokenPattern.lastIndex = 0; // Reset regex
			const processedPath = folderPath.replace(tokenPattern, (match, token) => {
				return momentDate.format(token);
			});

			return processedPath;
		};

		const fileCheck = (file: TAbstractFile, oldPath?: string, caller?: string) => {
			if (this.settings.trigger_auto_manual !== 'Automatic' && caller !== 'cmd') {
				return;
			}
			if (!(file instanceof TFile)) return;

			// The rename event with no basename change will be terminated.
			if (oldPath && oldPath.split('/').pop() === file.basename + '.' + file.extension) {
				return;
			}

			// Excluded Folder check
			const excludedFolderLength = excludedFolder.length;
			for (let i = 0; i < excludedFolderLength; i++) {
				if (
					!this.settings.use_regex_to_check_for_excluded_folder &&
					excludedFolder[i].folder &&
					file.parent.path === normalizePath(excludedFolder[i].folder)
				) {
					return;
				} else if (this.settings.use_regex_to_check_for_excluded_folder && excludedFolder[i].folder) {
					const regex = new RegExp(excludedFolder[i].folder);
					if (regex.test(file.parent.path)) {
						return;
					}
				}
			}

			const fileCache = this.app.metadataCache.getFileCache(file);
			// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
			if (isFmDisable(fileCache)) {
				return;
			}

			const fileName = file.basename;
			const fileFullName = file.basename + '.' + file.extension;
			const settingsLength = folderTagPattern.length;
			const cacheTag = getAllTags(fileCache);

			// checker
			for (let i = 0; i < settingsLength; i++) {
				const settingFolder = folderTagPattern[i].folder;
				const settingTag = folderTagPattern[i].tag;
				const settingPattern = folderTagPattern[i].pattern;
				const settingProperty = folderTagPattern[i].property;
				const settingPropertyValue = folderTagPattern[i].property_value;
				const settingDateProperty = folderTagPattern[i].date_property;
				// Tag check
				if (!settingPattern && !settingProperty) {
					if (!this.settings.use_regex_to_check_for_tags) {
						if (cacheTag.find((e) => e === settingTag)) {
							const processedFolder = processFolderPath(settingFolder, fileCache, settingDateProperty);
							fileMove(this.app, processedFolder, fileFullName, file);
							break;
						}
					} else if (this.settings.use_regex_to_check_for_tags) {
						const regex = new RegExp(settingTag);
						if (cacheTag.find((e) => regex.test(e))) {
							const processedFolder = processFolderPath(settingFolder, fileCache, settingDateProperty);
							fileMove(this.app, processedFolder, fileFullName, file);
							break;
						}
					}
					// Title check
				} else if (!settingTag && !settingProperty) {
					const regex = new RegExp(settingPattern);
					const isMatch = regex.test(fileName);
					if (isMatch) {
						const processedFolder = processFolderPath(settingFolder, fileCache, settingDateProperty);
						fileMove(this.app, processedFolder, fileFullName, file);
						break;
					}
					// Property check
				} else if (!settingTag && !settingPattern && settingProperty && settingPropertyValue) {
					const propertyValue = parseFrontMatterEntry(fileCache?.frontmatter, settingProperty);
					if (propertyValue !== undefined && propertyValue !== null) {
						try {
							const regex = new RegExp(settingPropertyValue);
							const propertyValueStr = String(propertyValue);
							if (regex.test(propertyValueStr)) {
								const processedFolder = processFolderPath(settingFolder, fileCache, settingDateProperty);
								fileMove(this.app, processedFolder, fileFullName, file);
								break;
							}
						} catch (e) {
							console.error(`[Auto Note Mover] Invalid regex pattern in property_value: "${settingPropertyValue}"`);
						}
					}
				}
			}
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
			this.registerEvent(this.app.vault.on('create', (file) => fileCheck(file)));
			this.registerEvent(this.app.metadataCache.on('changed', (file) => fileCheck(file)));
			this.registerEvent(this.app.vault.on('rename', (file, oldPath) => fileCheck(file, oldPath)));
		});

		const moveNoteCommand = (view: MarkdownView) => {
			if (isFmDisable(this.app.metadataCache.getFileCache(view.file))) {
				new Notice('Auto Note Mover is disabled in the frontmatter.');
				return;
			}
			fileCheck(view.file, undefined, 'cmd');
		};

		this.addCommand({
			id: 'Move-the-note',
			name: 'Move the note',
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
			id: 'Toggle-Auto-Manual',
			name: 'Toggle Auto-Manual',
			callback: () => {
				if (this.settings.trigger_auto_manual === 'Automatic') {
					this.settings.trigger_auto_manual = 'Manual';
					this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is Manual.');
				} else if (this.settings.trigger_auto_manual === 'Manual') {
					this.settings.trigger_auto_manual = 'Automatic';
					this.saveData(this.settings);
					new Notice('[Auto Note Mover]\nTrigger is Automatic.');
				}
				setIndicator();
			},
		});

		this.addSettingTab(new AutoNoteMoverSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
