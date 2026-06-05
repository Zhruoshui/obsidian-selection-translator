export type TranslationProviderId =
	| 'openai'
	| 'microsoft'
	| 'google'
	| 'deepl'
	| 'baidu'
	| 'youdao'
	| 'dictionary';

type ProviderLanguageCodes = Record<TranslationProviderId, string>;

interface LanguageCodeEntry {
	keys: string[];
	source?: Partial<ProviderLanguageCodes>;
	target: Partial<ProviderLanguageCodes>;
}

const LANGUAGE_CODE_ENTRIES: LanguageCodeEntry[] = [
	{
		keys: ['chinese simplified', 'chinese (simplified)', 'simplified chinese', '简体中文', '简中', '中文', 'zh-cn', 'zh-hans'],
		source: {
			microsoft: 'zh-Hans',
			google: 'zh-CN',
			deepl: 'ZH',
			baidu: 'zh',
			youdao: 'zh-CHS',
		},
		target: {
			microsoft: 'zh-Hans',
			google: 'zh-CN',
			deepl: 'ZH-HANS',
			baidu: 'zh',
			youdao: 'zh-CHS',
		},
	},
	{
		keys: ['chinese traditional', 'chinese (traditional)', 'traditional chinese', '繁体中文', '繁中', 'zh-tw', 'zh-hant'],
		source: {
			microsoft: 'zh-Hant',
			google: 'zh-TW',
			deepl: 'ZH',
			baidu: 'cht',
			youdao: 'zh-CHT',
		},
		target: {
			microsoft: 'zh-Hant',
			google: 'zh-TW',
			deepl: 'ZH-HANT',
			baidu: 'cht',
			youdao: 'zh-CHT',
		},
	},
	createSimpleEntry(['english', 'en', '英语', '英文'], 'en', 'EN', 'EN-US'),
	createSimpleEntry(['japanese', 'ja', 'jp', '日语', '日文'], 'ja', 'JA'),
	createSimpleEntry(['korean', 'ko', 'kor', '韩语', '韩文'], 'ko', 'KO'),
	createSimpleEntry(['french', 'fr', 'fra', '法语'], 'fr', 'FR'),
	createSimpleEntry(['german', 'de', '德语'], 'de', 'DE'),
	createSimpleEntry(['spanish', 'es', 'spa', '西班牙语'], 'es', 'ES'),
	createSimpleEntry(['italian', 'it', '意大利语'], 'it', 'IT'),
	createSimpleEntry(['russian', 'ru', '俄语'], 'ru', 'RU'),
	createSimpleEntry(['portuguese', 'pt', '葡萄牙语'], 'pt', 'PT', 'PT-BR'),
	createSimpleEntry(['dutch', 'nl', '荷兰语'], 'nl', 'NL'),
	createSimpleEntry(['polish', 'pl', '波兰语'], 'pl', 'PL'),
	createSimpleEntry(['arabic', 'ar', 'ara', '阿拉伯语'], 'ar', 'AR'),
	createSimpleEntry(['thai', 'th', '泰语'], 'th', 'TH'),
	createSimpleEntry(['vietnamese', 'vi', 'vie', '越南语'], 'vi', 'VI'),
];

export function isAutoLanguage(language: string) {
	const normalized = normalizeLanguageKey(language);
	return !normalized || normalized === 'auto' || normalized === '自动识别';
}

export function getProviderLanguageCode(
	language: string,
	provider: TranslationProviderId,
	role: 'source' | 'target',
) {
	if (isAutoLanguage(language)) {
		return role === 'source' ? undefined : '';
	}

	const normalized = normalizeLanguageKey(language);
	for (const entry of LANGUAGE_CODE_ENTRIES) {
		if (!entry.keys.includes(normalized)) {
			continue;
		}
		return role === 'source'
			? (entry.source?.[provider] ?? entry.target[provider])
			: entry.target[provider];
	}

	return normalizeDirectLanguageCode(language, provider);
}

function createSimpleEntry(
	keys: string[],
	commonCode: string,
	deeplSourceCode: string,
	deeplTargetCode = deeplSourceCode,
): LanguageCodeEntry {
	return {
		keys,
		source: {
			microsoft: commonCode,
			google: commonCode,
			deepl: deeplSourceCode,
			baidu: getBaiduLanguageCode(commonCode),
			youdao: commonCode,
		},
		target: {
			microsoft: commonCode,
			google: commonCode,
			deepl: deeplTargetCode,
			baidu: getBaiduLanguageCode(commonCode),
			youdao: commonCode,
		},
	};
}

function normalizeDirectLanguageCode(
	language: string,
	provider: TranslationProviderId,
) {
	const trimmed = language.trim();
	if (provider === 'deepl') {
		return trimmed.toUpperCase();
	}
	return trimmed;
}

function normalizeLanguageKey(language: string) {
	return language.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getBaiduLanguageCode(commonCode: string) {
	switch (commonCode) {
		case 'ja':
			return 'jp';
		case 'ko':
			return 'kor';
		case 'fr':
			return 'fra';
		case 'es':
			return 'spa';
		case 'vi':
			return 'vie';
		case 'ar':
			return 'ara';
		default:
			return commonCode;
	}
}
