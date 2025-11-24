let parseFrontMatterEntry;
try {
	({ parseFrontMatterEntry } = require('obsidian'));
} catch (e) {
	// Fallback for unit tests where obsidian runtime is unavailable
	parseFrontMatterEntry = (frontmatter, key) => (frontmatter ? frontmatter[key] : undefined);
}

const processFolderPath = (folderPath, fileCache, file, rule) => {
	const tokenPattern = /\{\{(.+?)\}\}/g;
	const hasTokens = tokenPattern.test(folderPath);
	if (!hasTokens) return folderPath;

	// Prefer date condition, fall back to legacy date_property
	const dateCond = (rule?.conditions || []).find((c) => c?.type === 'date');
	const dateSource = dateCond?.dateSource || (dateCond ? 'frontmatter' : undefined);
	const metadataField = dateCond?.metadataField || 'ctime';
	const frontmatterKey = dateCond?.value || rule?.date_property || '';
	let dateValue = undefined;

	if (dateSource === 'metadata') {
		const stat = file?.stat;
		if (!stat) return folderPath;
		dateValue = metadataField === 'mtime' ? stat.mtime : stat.ctime;
	} else if (frontmatterKey) {
		dateValue = parseFrontMatterEntry(fileCache?.frontmatter, frontmatterKey);
		if (dateValue === undefined || dateValue === null) {
			console.warn(
				`[Auto Note Mover] Date property "${frontmatterKey}" not found in frontmatter. Using literal path.`
			);
			return folderPath;
		}
	} else {
		return folderPath;
	}

	let momentDate;
	if (typeof window !== 'undefined' && window.moment) {
		momentDate = window.moment(dateValue);
	} else {
		// Fallback for testing environment
		const d = new Date(dateValue);
		if (!isNaN(d.getTime())) {
			momentDate = {
				isValid: () => true,
				format: (fmt) => {
					// Simple formatter for tests
					const pad = (n) => String(n).padStart(2, '0');
					return fmt
						.replace('YYYY', d.getFullYear())
						.replace('MM', pad(d.getMonth() + 1))
						.replace('DD', pad(d.getDate()));
				},
			};
		} else {
			momentDate = { isValid: () => false };
		}
	}

	if (!momentDate.isValid()) {
		console.warn(
			`[Auto Note Mover] Invalid date value "${dateValue}" for ${
				dateSource === 'metadata' ? metadataField : `property "${frontmatterKey}"`
			} . Using literal path.`
		);
		return folderPath;
	}

	tokenPattern.lastIndex = 0;
	return folderPath.replace(tokenPattern, (_, token) => momentDate.format(token));
};

module.exports = {
	processFolderPath,
};
