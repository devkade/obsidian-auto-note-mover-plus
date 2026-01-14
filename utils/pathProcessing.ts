import { CachedMetadata, parseFrontMatterEntry, TFile } from 'obsidian';
import { FolderTagRule, RuleCondition } from 'settings/settings';

interface MomentLike {
	isValid: () => boolean;
	format: (fmt: string) => string;
}

export const processFolderPath = (folderPath: string, fileCache: CachedMetadata | null | undefined, file: TFile, rule: FolderTagRule): string => {
	const tokenPattern = /\{\{(.+?)\}\}/g;
	const hasTokens = tokenPattern.test(folderPath);
	if (!hasTokens) return folderPath;

	// Prefer date condition, fall back to legacy date_property
	const dateCond = (rule?.conditions || []).find((c: RuleCondition) => c?.type === 'date');
	const dateSource = dateCond?.dateSource || (dateCond ? 'frontmatter' : undefined);
	const metadataField = dateCond?.metadataField || 'ctime';
	const frontmatterKey = dateCond?.value || rule?.date_property || '';
	let dateValue: unknown = undefined;

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

	let momentDate: MomentLike;
	if (typeof window !== 'undefined' && (window as { moment?: (value: unknown) => MomentLike }).moment) {
		momentDate = (window as { moment: (value: unknown) => MomentLike }).moment(dateValue);
	} else {
		// Fallback for testing environment
		const d = new Date(dateValue as string | number | Date);
		if (!isNaN(d.getTime())) {
			momentDate = {
				isValid: () => true,
				format: (fmt: string) => {
					// Simple formatter for tests
					const pad = (n: number) => String(n).padStart(2, '0');
					return fmt
						.replace('YYYY', String(d.getFullYear()))
						.replace('MM', pad(d.getMonth() + 1))
						.replace('DD', pad(d.getDate()));
				},
			};
		} else {
			momentDate = { isValid: () => false, format: () => '' };
		}
	}

	if (!momentDate.isValid()) {
		const dateValueStr = typeof dateValue === 'object' && dateValue !== null
			? JSON.stringify(dateValue)
			: String(dateValue ?? '');
		console.warn(
			`[Auto Note Mover] Invalid date value "${dateValueStr}" for ${
				dateSource === 'metadata' ? metadataField : `property "${frontmatterKey}"`
			}. Using literal path.`
		);
		return folderPath;
	}

	tokenPattern.lastIndex = 0;
	return folderPath.replace(tokenPattern, (_, token: string) => momentDate.format(token));
};
