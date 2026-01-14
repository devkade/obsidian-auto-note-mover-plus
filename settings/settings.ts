import AutoNoteMover from 'main';
import { App, PluginSettingTab, Setting, ButtonComponent } from 'obsidian';

import { FolderSuggest } from 'suggests/file-suggest';
import { TagSuggest } from 'suggests/tag-suggest';
import { arrayMove } from 'utils/Utils';

export type MatchMode = 'ALL' | 'ANY';

export type ConditionType = 'tag' | 'title' | 'property' | 'date';

export type DateSource = 'frontmatter' | 'metadata';
export type MetadataField = 'ctime' | 'mtime';

export interface RuleCondition {
	type: ConditionType;
	/**
	 * Raw user value.
	 * - tag: tag string (regex respected if global toggle enabled)
	 * - title: regex pattern string
	 * - property: `key` or `key=pattern`
	 * - date (frontmatter): key name containing the date value
	 */
	value: string;
	/**
	 * Date-specific metadata
	 */
	dateSource?: DateSource;
	metadataField?: MetadataField;
}

export interface FolderTagRule {
	folder: string;
	match: MatchMode;
	conditions: RuleCondition[];
	date_property?: string;
	collapsed?: boolean;
	sourceFolders?: string[];
	sourceIncludeSubfolders?: boolean;
}

export interface ExcludedFolder {
	folder: string;
}

export interface AutoNoteMoverSettings {
	trigger_auto_manual: string;
	trigger_on_file_creation: boolean;
	use_regex_to_check_for_tags: boolean;
	statusBar_trigger_indicator: boolean;
	folder_tag_pattern: Array<FolderTagRule>;
	use_regex_to_check_for_excluded_folder: boolean;
	excluded_folder: Array<ExcludedFolder>;
}

export const DEFAULT_SETTINGS: AutoNoteMoverSettings = {
	trigger_auto_manual: 'Automatic',
	trigger_on_file_creation: false,
	use_regex_to_check_for_tags: false,
	statusBar_trigger_indicator: true,
	folder_tag_pattern: [{ folder: '', match: 'ALL', conditions: [], date_property: '', collapsed: false, sourceFolders: [], sourceIncludeSubfolders: false }],
	use_regex_to_check_for_excluded_folder: false,
	excluded_folder: [{ folder: '' }],
};

export class AutoNoteMoverSettingTab extends PluginSettingTab {
	plugin: AutoNoteMover;

	constructor(app: App, plugin: AutoNoteMover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		this.containerEl.empty();
		this.add_auto_note_mover_setting();
	}

	add_auto_note_mover_setting(): void {
		const descEl = document.createDocumentFragment();

		new Setting(this.containerEl)
			.setName('Auto Note Mover')
			.setHeading();

		new Setting(this.containerEl).setDesc(
			'Auto Note Mover will automatically move the active notes to their respective folders according to the rules.'
		);

		/* new Setting(this.containerEl)
			.setName('Auto Note Mover')
			.setDesc('Enable or disable the Auto Note Mover.')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enable_auto_note_mover)
					.onChange(async (use_new_auto_note_mover) => {
						this.plugin.settings.enable_auto_note_mover = use_new_auto_note_mover;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		if (!this.plugin.settings.enable_auto_note_mover) {
			return;
		} */

		const triggerDesc = document.createDocumentFragment();
		triggerDesc.append(
			'Choose how the trigger will be activated.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Automatic ' }),
			'is triggered when you create, edit, or rename a note, and moves the note if it matches the rules.',
			descEl.createEl('br'),
			'You can also activate the trigger with a command.',
			descEl.createEl('br'),
			descEl.createEl('strong', { text: 'Manual ' }),
			'will not automatically move notes.',
			descEl.createEl('br'),
			'You can trigger by command.'
		);
		new Setting(this.containerEl)
			.setName('Trigger')
			.setDesc(triggerDesc)
			.addDropdown((dropDown) =>
				dropDown
					.addOption('Automatic', 'Automatic')
					.addOption('Manual', 'Manual')
					.setValue(this.plugin.settings.trigger_auto_manual)
					.onChange((value: string) => {
						this.plugin.settings.trigger_auto_manual = value;
						void this.plugin.saveData(this.plugin.settings);
						this.display();
					})
			);

		const triggerOnFileCreationDesc = document.createDocumentFragment();
		triggerOnFileCreationDesc.append(
			'If disabled, notes will not be moved when created.',
			descEl.createEl('br'),
			'Only rename and metadata changes will trigger the move.'
		);
		new Setting(this.containerEl)
			.setName('Trigger on file creation')
			.setDesc(triggerOnFileCreationDesc)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.trigger_on_file_creation).onChange(async (value) => {
					this.plugin.settings.trigger_on_file_creation = value;
					await this.plugin.saveSettings();
				});
			});

		const useRegexToCheckForTags = document.createDocumentFragment();
		useRegexToCheckForTags.append(
			'If enabled, tags will be checked with regular expressions.',
			descEl.createEl('br'),
			'For example, if you want to match the #tag, you would write ',
			descEl.createEl('strong', { text: '^#tag$' }),
			descEl.createEl('br'),
			'This setting is for a specific purpose, such as specifying nested tags in bulk.',
			descEl.createEl('br'),
			descEl.createEl('strong', {
				text: 'If you want to use the suggested tags as they are, it is recommended to disable this setting.',
			})
		);
		new Setting(this.containerEl)
			.setName('Use regular expressions to check for tags')
			.setDesc(useRegexToCheckForTags)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.use_regex_to_check_for_tags).onChange(async (value) => {
					this.plugin.settings.use_regex_to_check_for_tags = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			'1) Destination folder: supports moment.js tokens like ',
			descEl.createEl('strong', { text: '{{YYYY}}/{{MM}}' }),
			'.',
			descEl.createEl('br'),
			'2) Add one or more conditions (tag / title regex / property / date). Combine them with ',
			descEl.createEl('strong', { text: 'Match if all / any' }),
			'.',
			descEl.createEl('br'),
			'3) Rules are processed top-to-bottom. First match wins.',
			descEl.createEl('br'),
			descEl.createEl('br'),
			'Tag: include the leading # (regex honored if enabled above).',
			descEl.createEl('br'),
			'Title: JavaScript regex, e.g., ',
			descEl.createEl('strong', { text: 'draft$' }),
			'.',
			descEl.createEl('br'),
			'Property: single field. Use ',
			descEl.createEl('strong', { text: 'key' }),
			' to require existence, or ',
			descEl.createEl('strong', { text: 'key=pattern' }),
			' to match a value/regex.',
			descEl.createEl('br'),
			'Date: choose source (frontmatter key or file metadata ctime/mtime). Frontmatter keys must parse as dates; metadata uses the file timestamps. When folder path has {{tokens}}, that date is formatted with moment.js.',
			descEl.createEl('br'),
			'If the date is missing or cannot be parsed, the folder path is used as literal text (tokens stay as {{...}}).',
			descEl.createEl('br'),
			descEl.createEl('br'),
			'Notice: attachments stay put; frontmatter "',
			descEl.createEl('strong', { text: 'AutoNoteMover: disable' }),
			'" skips movement.'
		);
		new Setting(this.containerEl)
			.setName('Add new rule')
			.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add new rule')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.folder_tag_pattern.push({
							folder: '',
							match: 'ALL',
							conditions: [],
							date_property: '',
							collapsed: false,
							sourceFolders: [],
							sourceIncludeSubfolders: false,
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.folder_tag_pattern.forEach((rule, index) => {
			// Ensure at least one condition exists if empty
			if (rule.conditions.length === 0) {
				rule.conditions.push({ type: 'tag', value: '' });
			}

			const renderConditionsList = (listEl: HTMLElement) => {
				listEl.empty();
				rule.conditions.forEach((cond, condIndex) => {
					const row = listEl.createDiv({ cls: 'anm-condition-row' });

					// Type Select
					const typeSelect = row.createEl('select');
					['tag', 'title', 'property', 'date'].forEach((opt) => {
						const o = typeSelect.createEl('option');
						o.value = opt;
						o.text = opt.charAt(0).toUpperCase() + opt.slice(1);
						o.selected = cond.type === opt;
					});

					// Date source controls (created once, toggled per type)
					const dateSourceWrap = row.createDiv({ cls: 'anm-date-source-wrap' });
					const dateSourceSelect = dateSourceWrap.createEl('select');
					['frontmatter', 'metadata'].forEach((opt) => {
						const o = dateSourceSelect.createEl('option');
						o.value = opt;
						o.text = opt === 'frontmatter' ? 'Frontmatter' : 'Metadata';
						o.selected = (cond.dateSource || 'frontmatter') === opt;
					});

				const metadataSelect = dateSourceWrap.createEl('select');
				metadataSelect.addClass('anm-metadata-select');
					['ctime', 'mtime'].forEach((opt) => {
						const o = metadataSelect.createEl('option');
						o.value = opt;
						o.text = opt === 'ctime' ? 'Created time' : 'Modified time';
						o.selected = (cond.metadataField || 'ctime') === opt;
					});

					// Value Input
					const input = row.createEl('input');
					input.type = 'text';
					input.value = cond.value;
					if (cond.type !== 'date') new TagSuggest(this.app, input);

					const updateInputState = () => {
						const source = cond.dateSource || 'frontmatter';
						if (cond.type === 'date') {
							input.placeholder = 'Frontmatter key (e.g., date)';
							dateSourceWrap.removeClass('anm-hidden');
							dateSourceWrap.addClass('anm-visible');
							const metaMode = source === 'metadata';
							dateSourceWrap.toggleClass('anm-flex-grow', metaMode);
							input.toggleClass('anm-hidden', metaMode);
							metadataSelect.toggleClass('anm-hidden', !metaMode);
							metadataSelect.toggleAttribute('disabled', !metaMode);
						} else {
							input.placeholder = 'Tag / regex / key=pattern';
							input.removeClass('anm-hidden');
							input.removeAttribute('disabled');
							dateSourceWrap.removeClass('anm-visible');
							dateSourceWrap.addClass('anm-hidden');
							metadataSelect.addClass('anm-hidden');
						}
					};

				const persistDateDefaults = () => {
					if (cond.type === 'date') {
						cond.dateSource = cond.dateSource || 'frontmatter';
						if (cond.dateSource === 'metadata') {
							cond.metadataField = cond.metadataField || 'ctime';
						} else {
							delete cond.metadataField;
						}
					}
				};

					typeSelect.onchange = async () => {
						cond.type = typeSelect.value as ConditionType;
						persistDateDefaults();
						updateInputState();
						await this.plugin.saveSettings();
					};

					dateSourceSelect.onchange = async () => {
						cond.dateSource = dateSourceSelect.value as DateSource;
						if (cond.dateSource === 'metadata') {
							cond.value = '';
							input.value = '';
						}
						updateInputState();
						await this.plugin.saveSettings();
					};

					metadataSelect.onchange = async () => {
						cond.metadataField = metadataSelect.value as MetadataField;
						await this.plugin.saveSettings();
					};

					input.onchange = async () => {
						cond.value = input.value;
						await this.plugin.saveSettings();
					};

					persistDateDefaults();
					updateInputState();

					// Delete Button
					new ButtonComponent(row)
						.setIcon('cross')
						.setTooltip('Delete condition')
						.onClick(async () => {
							rule.conditions.splice(condIndex, 1);
							if (rule.conditions.length === 0) {
								rule.conditions.push({ type: 'tag', value: '' });
							}
							await this.plugin.saveSettings();
							renderConditionsList(listEl);
						});
				});
			};

			// Create Card Container
			const card = this.containerEl.createDiv({ cls: 'anm-rule-card' });

			// --- Header: Folder, Date, Match Mode, Actions ---
			const header = card.createDiv({ cls: 'anm-card-header' });
			const headerMain = header.createDiv({ cls: 'anm-card-header-main' });
			const actions = header.createDiv({ cls: 'anm-card-actions' });
			// Collapse toggle (left top)
			const toggleBtn = new ButtonComponent(headerMain.createDiv({ cls: 'anm-collapse-btn' }))
				.setIcon(rule.collapsed ? 'chevron-right' : 'chevron-down')
				.setTooltip('Collapse/expand');

			toggleBtn.onClick(async () => {
				rule.collapsed = !rule.collapsed;
				await this.plugin.saveSettings();
				body.toggleClass('anm-collapsed', rule.collapsed);
				toggleBtn.setIcon(rule.collapsed ? 'chevron-right' : 'chevron-down');
			});

			// Folder Input
			const folderSetting = new Setting(headerMain)
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder('Folder')
						.setValue(rule.folder)
						.onChange(async (newFolder) => {
							this.plugin.settings.folder_tag_pattern[index].folder = newFolder.trim();
							await this.plugin.saveSettings();
						});
				});
			folderSetting.settingEl.addClass('anm-flex-grow');
			folderSetting.settingEl.addClass('anm-folder-setting');
			folderSetting.infoEl.remove();

			// Match Mode
			const matchSetting = new Setting(headerMain)
				.addDropdown((drop) => {
					drop
						.addOption('ALL', 'Match if all')
						.addOption('ANY', 'Match if any')
						.setValue(rule.match || 'ALL')
						.onChange(async (val: string) => {
							this.plugin.settings.folder_tag_pattern[index].match = val === 'ANY' ? 'ANY' : 'ALL';
							await this.plugin.saveSettings();
						});
				});
			matchSetting.infoEl.remove();

			// Actions (Up, Down, Delete)
			new ButtonComponent(actions)
				.setIcon('up-chevron-glyph')
				.setTooltip('Move up')
				.onClick(async () => {
					arrayMove(this.plugin.settings.folder_tag_pattern, index, index - 1);
					await this.plugin.saveSettings();
					this.display();
				});
			new ButtonComponent(actions)
				.setIcon('down-chevron-glyph')
				.setTooltip('Move down')
				.onClick(async () => {
					arrayMove(this.plugin.settings.folder_tag_pattern, index, index + 1);
					await this.plugin.saveSettings();
					this.display();
				});
			new ButtonComponent(actions)
				.setIcon('cross')
				.setTooltip('Delete')
				.onClick(async () => {
					this.plugin.settings.folder_tag_pattern.splice(index, 1);
					await this.plugin.saveSettings();
					this.display();
				});

			// --- Body (collapsible) ---
			const body = card.createDiv({ cls: 'anm-card-body' });
			if (rule.collapsed) {
				body.addClass('anm-collapsed');
			}


			// --- Divider ---
			body.createDiv({ cls: 'anm-card-divider' });

			// --- Source Folders Section ---
			const sourceFoldersDesc = document.createDocumentFragment();
			sourceFoldersDesc.append(
				'Only apply this rule to notes in these folders.',
				descEl.createEl('br'),
				'If empty, rule applies to all folders.'
			);
			new Setting(body)
				.setName('Source folders')
				.setDesc(sourceFoldersDesc)
				.addButton((button: ButtonComponent) => {
					button
						.setTooltip('Add source folder')
						.setButtonText('+')
						.onClick(async () => {
							if (!rule.sourceFolders) {
								rule.sourceFolders = [];
							}
							rule.sourceFolders.push('');
							await this.plugin.saveSettings();
							renderSourceFoldersList(sourceFoldersList);
						});
				});

			const sourceFoldersList = body.createDiv({ cls: 'anm-source-folders-list' });

			const renderSourceFoldersList = (listEl: HTMLElement) => {
				listEl.empty();
				if (!rule.sourceFolders) {
					rule.sourceFolders = [];
				}
				rule.sourceFolders.forEach((sourceFolder, sfIndex) => {
					const row = listEl.createDiv({ cls: 'anm-source-folder-row' });

					const searchSetting = new Setting(row)
						.addSearch((cb) => {
							new FolderSuggest(this.app, cb.inputEl);
							cb.setPlaceholder('Folder')
								.setValue(sourceFolder)
								.onChange(async (newFolder) => {
									rule.sourceFolders![sfIndex] = newFolder;
									await this.plugin.saveSettings();
								});
						});
					searchSetting.infoEl.remove();

					new ButtonComponent(row)
						.setIcon('cross')
						.setTooltip('Remove')
						.onClick(async () => {
							rule.sourceFolders!.splice(sfIndex, 1);
							await this.plugin.saveSettings();
							renderSourceFoldersList(listEl);
						});
				});
			};

			renderSourceFoldersList(sourceFoldersList);

			// --- Include Subfolders Toggle ---
			new Setting(body)
				.setName('Include subfolders')
				.setDesc('Also match notes in subfolders of the source folders.')
				.addToggle((toggle) => {
					toggle.setValue(rule.sourceIncludeSubfolders || false).onChange(async (value) => {
						rule.sourceIncludeSubfolders = value;
						await this.plugin.saveSettings();
					});
				});

			// --- Divider ---
			body.createDiv({ cls: 'anm-card-divider' });

			// --- Conditions List ---
			const conditionsList = body.createDiv({ cls: 'anm-card-conditions' });
			renderConditionsList(conditionsList);

			// --- Add Button ---
			const addBtnContainer = body.createDiv({ cls: 'anm-add-btn-container' });
			new ButtonComponent(addBtnContainer)
				.setButtonText('+ Add condition')
				.onClick(async () => {
					rule.conditions.push({ type: 'tag', value: '' });
					await this.plugin.saveSettings();
					renderConditionsList(conditionsList);
				});
		});

		const useRegexToCheckForExcludedFolder = document.createDocumentFragment();
		useRegexToCheckForExcludedFolder.append(
			'If enabled, excluded folder will be checked with regular expressions.'
		);

		new Setting(this.containerEl)
			.setName('Use regular expressions to check for excluded folder')
			.setDesc(useRegexToCheckForExcludedFolder)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.use_regex_to_check_for_excluded_folder).onChange(async (value) => {
					this.plugin.settings.use_regex_to_check_for_excluded_folder = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		const excludedFolderDesc = document.createDocumentFragment();
		excludedFolderDesc.append(
			'Notes in the excluded folder will not be moved.',
			descEl.createEl('br'),
			'This takes precedence over the notes movement rules.'
		);
		new Setting(this.containerEl)

			.setName('Add excluded folder')
			.setDesc(excludedFolderDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip('Add excluded folders')
					.setButtonText('+')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.excluded_folder.push({
							folder: '',
						});
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.excluded_folder.forEach((excluded_folder, index) => {
			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder('Folder')
						.setValue(excluded_folder.folder)
						.onChange(async (newFolder) => {
							this.plugin.settings.excluded_folder[index].folder = newFolder;
							await this.plugin.saveSettings();
						});
				})

				.addExtraButton((cb) => {
					cb.setIcon('up-chevron-glyph')
						.setTooltip('Move up')
						.onClick(async () => {
							arrayMove(this.plugin.settings.excluded_folder, index, index - 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('down-chevron-glyph')
						.setTooltip('Move down')
						.onClick(async () => {
							arrayMove(this.plugin.settings.excluded_folder, index, index + 1);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((cb) => {
					cb.setIcon('cross')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.excluded_folder.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
			s.infoEl.remove();
		});

		const statusBarTriggerIndicatorDesc = document.createDocumentFragment();
		statusBarTriggerIndicatorDesc.append(
			'The status bar will display [A] if the trigger is Automatic, and [M] for Manual.',
			descEl.createEl('br'),
			'To change the setting, you need to restart Obsidian.',
			descEl.createEl('br'),
			'Desktop only.'
		);
		new Setting(this.containerEl)
			.setName('Status bar trigger indicator')
			.setDesc(statusBarTriggerIndicatorDesc)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.statusBar_trigger_indicator).onChange(async (value) => {
					this.plugin.settings.statusBar_trigger_indicator = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});
	}
}
