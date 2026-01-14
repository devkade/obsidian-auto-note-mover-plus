import { App, CachedMetadata, normalizePath, Notice, parseFrontMatterEntry, TFile, TFolder } from 'obsidian';

// Disable AutoNoteMover when "AutoNoteMover: disable" is present in the frontmatter.
export const isFmDisable = (fileCache?: CachedMetadata | null) => {
	// Metadata cache can be null immediately after creation; treat as not disabled until it resolves.
	if (!fileCache || !fileCache.frontmatter) return false;
	const fm = parseFrontMatterEntry(fileCache.frontmatter, 'AutoNoteMover');
	return fm === 'disable';
};

// Create folder if it doesn't exist
export const createFolderIfNotExists = async (app: App, folderPath: string): Promise<void> => {
	const normalizedPath = normalizePath(folderPath);
	const folder = app.vault.getAbstractFileByPath(normalizedPath);

	if (!folder) {
		try {
			await app.vault.createFolder(normalizedPath);
		} catch (error) {
			console.error(`[Auto Note Mover] Error creating folder "${normalizedPath}":`, error);
		}
	}
};

const folderOrFile = (app: App, path: string) => {
	const F = app.vault.getAbstractFileByPath(path);
	if (F instanceof TFile) {
		return TFile;
	} else if (F instanceof TFolder) {
		return TFolder;
	}
};

const isTFExists = (app: App, path: string, F: typeof TFile | typeof TFolder) => {
	if (folderOrFile(app, normalizePath(path)) === F) {
		return true;
	} else {
		return false;
	}
};

export const fileMove = async (app: App, settingFolder: string, fileFullName: string, file: TFile, hideNotifications?: boolean, duplicateFileAction?: 'skip' | 'merge', caller?: string) => {
	// Create folder if it doesn't exist
	await createFolderIfNotExists(app, settingFolder);

	// Does the file with the same name exist in the destination folder?
	const newPath = normalizePath(settingFolder + '/' + fileFullName);
	if (isTFExists(app, newPath, TFile) && newPath !== file.path) {
		// Handle duplicate file based on action setting
		if (duplicateFileAction) {
			const handled = await handleDuplicateFile(app, file, newPath, duplicateFileAction, caller || '');
			if (handled) {
				// Merge dialog was shown, don't show error notice
				return;
			}
			// Skip or fallback, don't move
			return;
		}
		// Fallback to skip if no action specified
		new Notice(
			`[Auto Note Mover]\nError: A file with the same name\n"${fileFullName}"\nexists at the destination folder.`
		);
		return;
	}
	// Is the destination folder the same path as the current folder?
	if (newPath === file.path) {
		return;
	}
	// Move file
	await app.fileManager.renameFile(file, newPath);
	// Success notification is only shown when hideNotifications is false
	if (!hideNotifications) {
		new Notice(`[Auto Note Mover]\nMoved the note "${fileFullName}"\nto the "${settingFolder}".`);
	}
};

export const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): void => {
	if (toIndex < 0 || toIndex === array.length) {
		return;
	}
	const temp = array[fromIndex];
	array[fromIndex] = array[toIndex];
	array[toIndex] = temp;
};

export const getTriggerIndicator = (trigger: string) => {
	if (trigger === 'Automatic') {
		return `[A]`;
	} else {
		return `[M]`;
	}
};

// Note Composer 플러그인이 활성화되어 있는지 확인
export const isNoteComposerEnabled = (app: App): boolean => {
	const appAny = app as any;
	const plugin = appAny.internalPlugins?.getPluginById('note-composer');
	return plugin && plugin.enabled;
};

// 중복 파일 처리 (skip 또는 merge)
export const handleDuplicateFile = async (
	app: App,
	sourceFile: TFile,
	destFilePath: string,
	action: 'skip' | 'merge',
	caller: string
): Promise<boolean> => {
	// true = 처리됨, false = 스킵됨
	
	if (action === 'skip') {
		new Notice(
			`[Auto Note Mover]\nError: A file with the same name\n"${sourceFile.name}"\nexists at the destination folder.`
		);
		return false;
	}
	
	// Merge는 Manual 모드에서만 실행 (Automatic 모드는 skip)
	if (caller !== 'cmd') {
		new Notice(
			`[Auto Note Mover]\nError: A file with the same name\n"${sourceFile.name}"\nexists at the destination folder.`
		);
		return false;
	}
	
	if (!isNoteComposerEnabled(app)) {
		new Notice('[Auto Note Mover] Note Composer is disabled. Falling back to skip.');
		return false;
	}
	
	// Note Composer Merge 모달 열기
	const destFile = app.vault.getAbstractFileByPath(destFilePath);
	if (destFile instanceof TFile) {
		const appAny = app as any;
		// 파일 활성화
		await app.workspace.openLinkText(destFile.path, '');
		// 약간 대기하여 파일 활성화 완료 대기
		await new Promise(resolve => setTimeout(resolve, 100));
		// Merge 명령 실행
		appAny.commands.executeCommandById('note-composer:merge-file');
	}
	
	return true;
};
