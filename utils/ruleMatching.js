let parseFrontMatterEntry;
try {
	({ parseFrontMatterEntry } = require('obsidian'));
} catch (e) {
	// Fallback for unit tests where obsidian runtime is unavailable
	parseFrontMatterEntry = (frontmatter, key) => (frontmatter ? frontmatter[key] : undefined);
}

const compileUserRegex = (pattern) => {
	if (!pattern) return null;
	try {
		if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
			const lastSlash = pattern.lastIndexOf('/');
			const body = pattern.slice(1, lastSlash);
			const flags = pattern.slice(lastSlash + 1);
			return new RegExp(body, flags);
		}
		return new RegExp(pattern);
	} catch (e) {
		console.error(`[Auto Note Mover] Invalid regex: ${pattern}`);
		return null;
	}
};

const parsePropertyCondition = (raw) => {
	const hasEquals = raw.includes('=');
	if (!hasEquals) {
		return { key: raw.trim(), regex: null, requireValue: false };
	}
	const [keyPart, ...rest] = raw.split('=');
	const key = keyPart.trim();
	const value = rest.join('=').trim();
	if (!key) return { key: '', regex: null, requireValue: true };
	if (!value) return { key, regex: null, requireValue: true };
	return { key, regex: compileUserRegex(value), requireValue: true };
};

const hasValue = (val) => val !== undefined && val !== null && String(val).trim() !== '';


const coerceToMoment = (value) => {
	try {
		if (typeof window !== 'undefined' && window.moment) {
			const m = window.moment(value);
			if (m.isValid()) return m;
		}
	} catch (e) {
		// ignore and fall back to Date
	}
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return null;
	return {
		isValid: () => true,
		format: (token) => {
			// Approximate formatting for tests when moment is unavailable
			const pad = (n) => String(n).padStart(2, '0');
			switch (token) {
				case 'YYYY':
					return String(d.getFullYear());
				case 'MM':
					return pad(d.getMonth() + 1);
				case 'DD':
					return pad(d.getDate());
				default:
					return token;
			}
		},
	};
};

const evaluateCondition = (cond, ctx) => {
	const { fileCache, fileName, tags, useRegexForTags, file } = ctx;
	switch (cond.type) {
		case 'tag': {
			if (!cond.value) return false;
			const rawValue = cond.value.trim();
			if (!rawValue) return false;
			if (useRegexForTags) {
				const regex = compileUserRegex(cond.value);
				return !!regex && tags.some((t) => regex.test(t));
			}
			const normalizedRuleWithHash = rawValue.startsWith('#') ? rawValue : `#${rawValue}`;
			const normalizedRuleNoHash = rawValue.startsWith('#') ? rawValue.slice(1) : rawValue;
			return tags.some((t) => {
				const tag = (t || '').trim();
				if (!tag) return false;
				if (tag === rawValue || tag === normalizedRuleWithHash) return true;
				const tagNoHash = tag.startsWith('#') ? tag.slice(1) : tag;
				return tagNoHash === normalizedRuleNoHash;
			});
		}
		case 'title': {
			const regex = compileUserRegex(cond.value);
			return !!regex && regex.test(fileName);
		}
		case 'property': {
			const parsed = parsePropertyCondition(cond.value || '');
			if (!parsed.key) return false;
			const propVal = parseFrontMatterEntry(fileCache?.frontmatter, parsed.key);
			if (!hasValue(propVal)) return false;
			if (!parsed.requireValue) return true;
			if (!parsed.regex) return false;
			try {
				return parsed.regex.test(String(propVal));
			} catch (e) {
				return false;
			}
		}
		case 'date': {
			const source = cond.dateSource || 'frontmatter';
			if (source === 'metadata') {
				const stat = file?.stat;
				if (!stat) return false;
				const ts = (cond.metadataField === 'mtime' ? stat?.mtime : stat?.ctime) ?? stat?.ctime;
				if (!ts) return false;
				const m = coerceToMoment(ts);
				return !!m && m.isValid();
			}

			const key = (cond.value || '').trim();
			if (!key) return false;
			const val = parseFrontMatterEntry(fileCache?.frontmatter, key);
			if (!hasValue(val)) return false;
			const m = coerceToMoment(val);
			return !!m && m.isValid();
		}
		default:
			return false;
	}
};

const activeConditions = (conditions = []) => {
	return conditions.filter((cond) => {
		if (!cond || !cond.type) return false;
		const value = (cond.value ?? '').trim();
		if (cond.type === 'date') {
			const source = cond.dateSource || 'frontmatter';
			if (source === 'metadata') return !!cond.metadataField;
			return value !== '';
		}
		if (value === '') return false;
		if (cond.type === 'property') {
			const parsed = parsePropertyCondition(value);
			return !!parsed.key;
		}
		return true;
	});
};

const isRuleMatched = (rule, ctx) => {
	const conditions = activeConditions(rule?.conditions || []);
	if (!conditions.length) return false;
	const results = conditions.map((c) => evaluateCondition(c, ctx));
	const mode = rule?.match === 'ANY' ? 'ANY' : 'ALL';
	return mode === 'ANY' ? results.some(Boolean) : results.every(Boolean);
};

module.exports = {
	compileUserRegex,
	parsePropertyCondition,
	evaluateCondition,
	isRuleMatched,
};
