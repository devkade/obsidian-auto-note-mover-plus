import { AbstractInputSuggest, App, TFile, getAllTags } from 'obsidian';

export class TagSuggest extends AbstractInputSuggest<string> {
	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
	}

	getSuggestions(inputStr: string): string[] {
		const fileArray = this.app.vault.getMarkdownFiles();
		const fileCache = fileArray.map((value: TFile) => this.app.metadataCache.getFileCache(value));
		const tagArray = fileCache.map((value) => getAllTags(value));
		const tagArrayJoin = tagArray.join();
		const tagArraySplit = tagArrayJoin.split(',');
		const tagArrayFilter = tagArraySplit.filter(Boolean);
		const tagList = [...new Set(tagArrayFilter)];

		const tagMatch: string[] = [];
		const lowerCaseInputStr = inputStr.toLowerCase();

		tagList.forEach((tag: string) => {
			if (tag.toLowerCase().contains(lowerCaseInputStr)) {
				tagMatch.push(tag);
			}
		});

		return tagMatch;
	}

	renderSuggestion(tag: string, el: HTMLElement): void {
		el.setText(tag);
	}

	selectSuggestion(tag: string): void {
		this.setValue(tag);
		this.close();
	}
}
