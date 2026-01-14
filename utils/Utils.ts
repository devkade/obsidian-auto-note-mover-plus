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

export const fileMove = async (app: App, settingFolder: string, fileFullName: string, file: TFile, hideNotifications?: boolean) => {
	// Create folder if it doesn't exist
	await createFolderIfNotExists(app, settingFolder);

	// Does the file with the same name exist in the destination folder?
	const newPath = normalizePath(settingFolder + '/' + fileFullName);
	if (isTFExists(app, newPath, TFile) && newPath !== file.path) {
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
