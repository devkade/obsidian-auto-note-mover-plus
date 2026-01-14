// Mock obsidian module for tests
export const parseFrontMatterEntry = (frontmatter: Record<string, unknown> | null | undefined, key: string) => {
	return frontmatter ? frontmatter[key] : undefined;
};

export const CachedMetadata = class {};

export const TFile = class {};
