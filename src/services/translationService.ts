import { requestUrl } from 'obsidian';
import { t } from '../i18n';
import { collapseWhitespaceOnResult } from '../selection/textNormalize';
import {
	DEFAULT_SETTINGS,
	type SelectionTranslatorSettings,
	type DictionaryProviderId,
} from '../settings';
import {
	getProviderLanguageCode,
	resolveTextTranslationProvider,
	type TextTranslationProviderId,
	type TranslationProviderId,
} from './languageCodes';
import { OpenAICompatibleChatService } from './openAICompatibleChat';
import type {
	PronunciationAudio,
	TranslationResult,
} from '../translation/task';

interface TranslationRequestOptions {
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
}

const RETRY_MAX_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 3000;
const RETRY_JITTER_RATIO = 0.2;

export class TranslationService {
	private readonly openAI = new OpenAICompatibleChatService();

	async translate(
		text: string,
		settings: SelectionTranslatorSettings,
		options: TranslationRequestOptions = {},
	) {
		if (isDictionaryLookupText(text)) {
			return translateWithDictionary(text, settings.dictionaryProvider);
		}

		return this.translateWithProvider(
			text,
			resolveTextTranslationProvider(settings.provider),
			settings,
			options,
		);
	}

	async testConnection(settings: SelectionTranslatorSettings) {
		const provider = resolveTextTranslationProvider(settings.provider);
		if (provider === 'openai') {
			await this.openAI.testConnection(settings);
			return;
		}

		await this.translateWithProvider('Hello', provider, settings);
	}

	private translateWithProvider(
		text: string,
		provider: TextTranslationProviderId,
		settings: SelectionTranslatorSettings,
		options: TranslationRequestOptions = {},
	): Promise<string> {
		const invoke = (): Promise<string> => {
			switch (provider) {
				case 'openai':
					return this.openAI.translate(text, settings, options);
				case 'microsoft':
					return translateWithMicrosoft(text, settings);
				case 'google':
					return translateWithGoogle(text, settings);
				case 'deepl':
					return translateWithDeepL(text, settings);
				case 'baidu':
					return translateWithBaidu(text, settings);
				case 'youdao':
					return translateWithYoudao(text, settings);
			}
		};

		return withRetry(invoke, options.signal).then((result) =>
			collapseWhitespaceOnResult(result).trim(),
		);
	}
}

async function translateWithMicrosoft(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const key = requireSetting(
		settings.microsoftTranslatorKey,
		t('settingsMicrosoftTranslatorKeyName'),
	);
	const endpoint =
		settings.microsoftTranslatorEndpoint.trim() ||
		DEFAULT_SETTINGS.microsoftTranslatorEndpoint;
	const targetLanguage = requireTargetLanguage(
		getProviderLanguageCode(settings.targetLanguage, 'microsoft', 'target'),
	);
	const sourceLanguage = getProviderLanguageCode(
		settings.sourceLanguage,
		'microsoft',
		'source',
	);
	const params = new URLSearchParams({
		'api-version': '3.0',
		to: targetLanguage,
	});
	if (sourceLanguage) {
		params.set('from', sourceLanguage);
	}

	const headers: Record<string, string> = {
		'Ocp-Apim-Subscription-Key': key,
		'Content-Type': 'application/json; charset=UTF-8',
	};
	if (settings.microsoftTranslatorRegion.trim()) {
		headers['Ocp-Apim-Subscription-Region'] =
			settings.microsoftTranslatorRegion.trim();
	}

	const response = await requestUrl({
		url: `${endpoint.replace(/\/+$/, '')}/translate?${params.toString()}`,
		method: 'POST',
		headers,
		body: JSON.stringify([{ Text: text }]),
		throw: false,
	});
	ensureSuccessfulResponse(response.status, response.json, response.text);

	const translatedText = getMicrosoftTranslatedText(response.json);
	if (!translatedText) {
		throw new Error(t('providerMissingTranslatedText'));
	}
	return translatedText.trim();
}

async function translateWithGoogle(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const apiKey = requireSetting(
		settings.googleTranslateApiKey,
		t('settingsGoogleTranslateApiKeyName'),
	);
	const targetLanguage = requireTargetLanguage(
		getProviderLanguageCode(settings.targetLanguage, 'google', 'target'),
	);
	const sourceLanguage = getProviderLanguageCode(
		settings.sourceLanguage,
		'google',
		'source',
	);
	const body: Record<string, string> = {
		q: text,
		target: targetLanguage,
		format: 'text',
	};
	if (sourceLanguage) {
		body.source = sourceLanguage;
	}

	const response = await requestUrl({
		url: `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		throw: false,
	});
	ensureSuccessfulResponse(response.status, response.json, response.text);

	const translatedText = getGoogleTranslatedText(response.json);
	if (!translatedText) {
		throw new Error(t('providerMissingTranslatedText'));
	}
	return translatedText.trim();
}

async function translateWithDeepL(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const apiKey = requireSetting(
		settings.deeplApiKey,
		t('settingsDeepLApiKeyName'),
	);
	const endpoint =
		settings.deeplApiBaseUrl.trim() || DEFAULT_SETTINGS.deeplApiBaseUrl;
	const targetLanguage = requireTargetLanguage(
		getProviderLanguageCode(settings.targetLanguage, 'deepl', 'target'),
	);
	const sourceLanguage = getProviderLanguageCode(
		settings.sourceLanguage,
		'deepl',
		'source',
	);
	const body: Record<string, string | string[]> = {
		text: [text],
		target_lang: targetLanguage,
	};
	if (sourceLanguage) {
		body.source_lang = sourceLanguage;
	}

	const response = await requestUrl({
		url: `${endpoint.replace(/\/+$/, '')}/v2/translate`,
		method: 'POST',
		headers: {
			Authorization: `DeepL-Auth-Key ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		throw: false,
	});
	ensureSuccessfulResponse(response.status, response.json, response.text);

	const translatedText = getDeepLTranslatedText(response.json);
	if (!translatedText) {
		throw new Error(t('providerMissingTranslatedText'));
	}
	return translatedText.trim();
}

async function translateWithBaidu(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const appId = requireSetting(
		settings.baiduTranslateAppId,
		t('settingsBaiduTranslateAppIdName'),
	);
	const secretKey = requireSetting(
		settings.baiduTranslateSecretKey,
		t('settingsBaiduTranslateSecretKeyName'),
	);
	const salt = createSalt();
	const sourceLanguage =
		getProviderLanguageCode(settings.sourceLanguage, 'baidu', 'source') ??
		'auto';
	const targetLanguage = requireTargetLanguage(
		getProviderLanguageCode(settings.targetLanguage, 'baidu', 'target'),
	);
	const sign = md5(`${appId}${text}${salt}${secretKey}`);
	const body = new URLSearchParams({
		q: text,
		from: sourceLanguage,
		to: targetLanguage,
		appid: appId,
		salt,
		sign,
	});

	const response = await requestUrl({
		url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
		throw: false,
	});
	ensureSuccessfulResponse(response.status, response.json, response.text);
	const translatedText = getBaiduTranslatedText(response.json);
	if (!translatedText) {
		throw new Error(getBaiduError(response.json));
	}
	return translatedText.trim();
}

async function translateWithYoudao(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const appKey = requireSetting(
		settings.youdaoTranslateAppKey,
		t('settingsYoudaoTranslateAppKeyName'),
	);
	const appSecret = requireSetting(
		settings.youdaoTranslateAppSecret,
		t('settingsYoudaoTranslateAppSecretName'),
	);
	const salt = createSalt();
	const curtime = String(Math.floor(Date.now() / 1000));
	const sourceLanguage =
		getProviderLanguageCode(settings.sourceLanguage, 'youdao', 'source') ??
		'auto';
	const targetLanguage = requireTargetLanguage(
		getProviderLanguageCode(settings.targetLanguage, 'youdao', 'target'),
	);
	const sign = await sha256(
		`${appKey}${getYoudaoInput(text)}${salt}${curtime}${appSecret}`,
	);
	const body = new URLSearchParams({
		q: text,
		from: sourceLanguage,
		to: targetLanguage,
		appKey,
		salt,
		sign,
		signType: 'v3',
		curtime,
	});

	const response = await requestUrl({
		url: 'https://openapi.youdao.com/api',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body.toString(),
		throw: false,
	});
	ensureSuccessfulResponse(response.status, response.json, response.text);
	const translatedText = getYoudaoTranslatedText(response.json);
	if (!translatedText) {
		throw new Error(getYoudaoError(response.json));
	}
	return translatedText.trim();
}

async function translateWithDictionary(
	text: string,
	provider: DictionaryProviderId,
): Promise<TranslationResult> {
	const word = normalizeDictionaryWord(text);
	switch (provider) {
		case 'youdao':
			return translateWithYoudaoDictionary(word);
		case 'bing':
			return translateWithBingDictionary(word);
		case 'cambridge':
			return translateWithCambridgeDictionary(word);
	}
}

async function translateWithYoudaoDictionary(
	word: string,
): Promise<TranslationResult> {
	const response = await requestDictionaryHtml(
		`https://m.youdao.com/dict?le=eng&q=${encodeURIComponent(word)}`,
	);
	const result = parseYoudaoDictionaryHtml(response.text);
	ensureDictionaryResult(result);
	return result;
}

async function translateWithBingDictionary(
	word: string,
): Promise<TranslationResult> {
	const response = await requestDictionaryHtml(
		`https://cn.bing.com/dict/search?q=${encodeURIComponent(word)}`,
	);
	const result = parseBingDictionaryHtml(response.text);
	ensureDictionaryResult(result);
	return result;
}

async function translateWithCambridgeDictionary(
	word: string,
): Promise<TranslationResult> {
	const response = await requestDictionaryHtml(
		`https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${encodeURIComponent(word)}`,
	);
	const result = parseCambridgeDictionaryHtml(response.text);
	ensureDictionaryResult(result);
	return result;
}

async function requestDictionaryHtml(url: string) {
	const response = await requestUrl({
		url,
		method: 'GET',
		headers: {
			Accept: 'text/html',
			'User-Agent':
				'Mozilla/5.0 (compatible; Obsidian Selection Translator)',
		},
		throw: false,
	});
	ensureSuccessfulResponse(response.status, undefined, response.text);
	return response;
}

function ensureDictionaryResult(result: TranslationResult) {
	if (!result.text.trim()) {
		throw new Error(t('dictionaryNoResult'));
	}
}

function isDictionaryLookupText(text: string) {
	return getDictionaryLookupWord(text) !== undefined;
}

function requireSetting(value: string, fieldName: string) {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new Error(t('providerMissingCredential', { field: fieldName }));
	}
	return trimmed;
}

function requireTargetLanguage(value: string | undefined) {
	if (!value) {
		throw new Error(t('providerMissingTargetLanguage'));
	}
	return value;
}

function ensureSuccessfulResponse(status: number, json: unknown, text: string) {
	if (status >= 200 && status < 300) {
		return;
	}
	throw new Error(getProviderError(json, text));
}

async function withRetry(
	invoke: () => Promise<string>,
	signal?: AbortSignal,
): Promise<string> {
	let attempt = 0;
	let lastError: unknown;

	while (attempt <= RETRY_MAX_ATTEMPTS) {
		if (signal?.aborted) {
			throw createAbortError();
		}
		try {
			return await invoke();
		} catch (error) {
			lastError = error;
			if (signal?.aborted) {
				throw createAbortError();
			}
			if (!isRetryableError(error) || attempt === RETRY_MAX_ATTEMPTS) {
				throw error;
			}
			const delay = computeBackoffDelay(attempt);
			await sleep(delay, signal);
			attempt += 1;
		}
	}

	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isRetryableError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	if (error.name === 'AbortError') {
		return false;
	}
	const message = error.message;
	if (!message) {
		return false;
	}
	if (RETRY_KEYWORDS.some((keyword) => message.toLowerCase().includes(keyword))) {
		return true;
	}
	const match = message.match(/\b(?:code[:\s]+|status[:\s]+|http[:\s]+)?(\d{3})\b/i);
	if (!match) {
		return false;
	}
	const status = Number(match[1]);
	return status === 429 || (status >= 500 && status < 600);
}

const RETRY_KEYWORDS = [
	'invalid access limit',
	'rate limit',
	'too many requests',
	'quota exceeded',
	'request timeout',
	'temporarily unavailable',
	'service unavailable',
	'invalid_request_error',
	'rate_limit_error',
];

function computeBackoffDelay(attempt: number): number {
	const exponential = RETRY_BASE_DELAY_MS * 2 ** attempt;
	const jitter = exponential * RETRY_JITTER_RATIO * (Math.random() * 2 - 1);
	return Math.min(RETRY_MAX_DELAY_MS, Math.max(0, exponential + jitter));
}

function sleep(delay: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, delay);
		const onAbort = () => {
			window.clearTimeout(timer);
			reject(createAbortError());
		};
		if (signal) {
			if (signal.aborted) {
				window.clearTimeout(timer);
				reject(createAbortError());
				return;
			}
			signal.addEventListener('abort', onAbort, { once: true });
		}
	});
}

function createAbortError(): Error {
	const error = new Error('Aborted');
	error.name = 'AbortError';
	return error;
}

function getMicrosoftTranslatedText(json: unknown) {
	if (!Array.isArray(json) || json.length === 0) {
		return undefined;
	}
	const firstResult: unknown = json[0];
	if (!isRecord(firstResult) || !Array.isArray(firstResult.translations)) {
		return undefined;
	}
	const firstTranslation: unknown = firstResult.translations[0];
	if (!isRecord(firstTranslation)) {
		return undefined;
	}
	return typeof firstTranslation.text === 'string'
		? firstTranslation.text
		: undefined;
}

function getGoogleTranslatedText(json: unknown) {
	if (!isRecord(json) || !isRecord(json.data)) {
		return undefined;
	}
	const translations: unknown = json.data.translations;
	if (!Array.isArray(translations) || translations.length === 0) {
		return undefined;
	}
	const firstTranslation: unknown = translations[0];
	if (!isRecord(firstTranslation)) {
		return undefined;
	}
	return typeof firstTranslation.translatedText === 'string'
		? firstTranslation.translatedText
		: undefined;
}

function getDeepLTranslatedText(json: unknown) {
	if (!isRecord(json) || !Array.isArray(json.translations)) {
		return undefined;
	}
	const firstTranslation: unknown = json.translations[0];
	if (!isRecord(firstTranslation)) {
		return undefined;
	}
	return typeof firstTranslation.text === 'string'
		? firstTranslation.text
		: undefined;
}

function getBaiduTranslatedText(json: unknown) {
	if (!isRecord(json) || !Array.isArray(json.trans_result)) {
		return undefined;
	}
	return json.trans_result
		.map((item: unknown) => (isRecord(item) ? item.dst : undefined))
		.filter((value): value is string => typeof value === 'string')
		.join('\n');
}

function getYoudaoTranslatedText(json: unknown) {
	if (!isRecord(json) || !Array.isArray(json.translation)) {
		return undefined;
	}
	return json.translation
		.filter((value): value is string => typeof value === 'string')
		.join('\n');
}

function getBaiduError(json: unknown) {
	if (isRecord(json)) {
		const message = json.error_msg ?? json.error_code;
		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}
	return t('providerMissingTranslatedText');
}

function getYoudaoError(json: unknown) {
	if (isRecord(json)) {
		const message = json.errorCode;
		if (typeof message === 'string' && message.trim() && message !== '0') {
			return t('providerRequestFailedWithCode', { code: message });
		}
	}
	return t('providerMissingTranslatedText');
}

function getProviderError(json: unknown, text: string) {
	if (isRecord(json) && isRecord(json.error)) {
		const message: unknown = json.error.message;
		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}
	if (isRecord(json)) {
		const message = json.message ?? json.error_msg ?? json.errorCode;
		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}
	if (text.trim()) {
		return text.trim();
	}
	return t('providerRequestFailed');
}

function normalizeDictionaryWord(text: string) {
	const word = getDictionaryLookupWord(text);
	if (word === undefined) {
		throw new Error(t('dictionaryOnlyEnglishWord'));
	}
	return word;
}

function getDictionaryLookupWord(text: string) {
	const word = text.trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
	if (!/^[A-Za-z]+(?:[-'][A-Za-z]+)*$/.test(word)) {
		return undefined;
	}
	return word;
}

function parseYoudaoDictionaryHtml(html: string): TranslationResult {
	const document = parseDictionaryDocument(html);
	const audio = getYoudaoPronunciationAudio(document);
	const lines = [
		...formatPronunciationAudioLines(audio),
		...getFirstNonEmptyLineGroup(
			document,
			[
				'.trans-container li',
				'.word-exp',
				'.basic .word-exp',
				'.wordbook-js .trans',
				'.trans',
			],
			12,
		),
	];

	return {
		text: uniqueLines(lines).join('\n').trim(),
		audio,
	};
}

function parseBingDictionaryHtml(html: string): TranslationResult {
	const document = parseDictionaryDocument(html);
	const audio = getBingPronunciationAudio(document);
	const lines = [
		...formatPronunciationAudioLines(audio),
		...getFirstNonEmptyLineGroup(
			document,
			[
				'.qdef .hd_area',
				'.qdef ul li',
				'.qdef .def',
				'.hd_if',
				'.hd_area',
			],
			12,
		),
	];

	return {
		text: uniqueLines(lines).join('\n').trim(),
		audio,
	};
}

function parseCambridgeDictionaryHtml(html: string): TranslationResult {
	const document = parseDictionaryDocument(html);
	const audio = getCambridgePronunciationAudio(document);
	const lines = [
		...formatPronunciationAudioLines(audio),
		...getFirstNonEmptyLineGroup(
			document,
			[
				'.def-block',
				'.pr.entry-body__el',
				'.sense-body',
				'.entry-body',
			],
			16,
		),
	];

	return {
		text: uniqueLines(lines).join('\n').trim(),
		audio,
	};
}

function parseDictionaryDocument(html: string) {
	const document = new DOMParser().parseFromString(html, 'text/html');
	for (const element of Array.from(document.querySelectorAll('script, style'))) {
		element.remove();
	}
	return document;
}

function getYoudaoPronunciationAudio(document: Document) {
	return getPronunciationAudioFromElements(
		document,
		[
			'a[data-rel]',
			'a[ref]',
			'a[href*="voice"]',
			'a[href*="audio"]',
			'.phonetic a',
		],
		(element, index) => {
			const url =
				element.getAttribute('data-rel') ??
				element.getAttribute('ref') ??
				element.getAttribute('href') ??
				'';
			return createPronunciationAudioFromElement(
				element,
				url,
				getYoudaoAudioAccent(element, index),
				'https://dict.youdao.com',
			);
		},
	);
}

function getBingPronunciationAudio(document: Document) {
	return getPronunciationAudioFromElements(
		document,
		['.hd_area a[onclick*="playSound"]', 'a[onclick*="playSound"]'],
		(element, index) => {
			const onclick = element.getAttribute('onclick') ?? '';
			return createPronunciationAudioFromElement(
				element,
				matchQuotedUrl(onclick),
				getBingAudioAccent(element, index),
				'https://cn.bing.com',
			);
		},
	);
}

function getCambridgePronunciationAudio(document: Document) {
	return getPronunciationAudioFromElements(
		document,
		['source[type="audio/mpeg"][src]', 'source[src]'],
		(element, index) => {
			const sourceUrl = element.getAttribute('src') ?? '';
			const parentText = getNormalizedText(element.closest('.pos-header, .dpron-i'));
			return createPronunciationAudioFromElement(
				element,
				sourceUrl,
				getCambridgeAudioAccent(parentText, sourceUrl, index),
				'https://dictionary.cambridge.org',
			);
		},
	);
}

function getPronunciationAudioFromElements(
	document: Document,
	selectors: string[],
	createAudio: (
		element: HTMLElement,
		index: number,
	) => PronunciationAudio | undefined,
) {
	const audio: PronunciationAudio[] = [];
	const seenUrls = new Set<string>();
	const elements = selectors.flatMap((selector) =>
		Array.from(document.querySelectorAll<HTMLElement>(selector)),
	);

	for (const [index, element] of elements.entries()) {
		const item = createAudio(element, index);
		if (!item || !item.url || seenUrls.has(item.url)) {
			continue;
		}
		seenUrls.add(item.url);
		audio.push(item);
	}

	return audio;
}

function createPronunciationAudioFromElement(
	element: Element,
	url: string,
	accent: PronunciationAudio['accent'],
	baseUrl: string,
) {
	const normalizedUrl = getAbsoluteDictionaryUrl(url, baseUrl);
	if (!normalizedUrl) {
		return undefined;
	}

	return {
		accent,
		label: getPronunciationAccentLabel(accent, element.getAttribute('title') ?? ''),
		phonetic: getNearbyPhonetic(element),
		url: normalizedUrl,
	};
}

function getFirstNonEmptyLineGroup(
	document: Document,
	selectors: string[],
	limit: number,
) {
	for (const selector of selectors) {
		const lines = Array.from(document.querySelectorAll(selector))
			.map((element) => getNormalizedText(element))
			.flatMap(splitDictionaryLines)
			.filter((line) => line.length > 0)
			.slice(0, limit);
		if (lines.length > 0) {
			return uniqueLines(lines);
		}
	}
	return [];
}

function splitDictionaryLines(text: string) {
	return text
		.split(/(?=(?:n|v|vi|vt|adj|adv|prep|conj|pron|abbr)\.\s)/i)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function uniqueLines(lines: string[]) {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const line of lines) {
		if (seen.has(line)) {
			continue;
		}
		seen.add(line);
		unique.push(line);
	}
	return unique;
}

function formatPronunciationAudioLines(audio: PronunciationAudio[]) {
	const lines: string[] = [];
	const seenLines = new Set<string>();
	for (const item of audio) {
		if (!item.phonetic) {
			continue;
		}
		const line = `${item.label} [${item.phonetic}]`;
		if (seenLines.has(line)) {
			continue;
		}
		seenLines.add(line);
		lines.push(line);
	}
	return lines;
}

function matchBracketedPhonetic(text: string) {
	return /\[([^\]]+)\]/.exec(text)?.[1]?.trim() ?? '';
}

function getPronunciationAccentLabel(
	accent: PronunciationAudio['accent'],
	fallback: string,
) {
	switch (accent) {
		case 'uk':
			return t('popoverPronunciationUk');
		case 'us':
			return t('popoverPronunciationUs');
		case 'other':
			return fallback.trim() || t('popoverPronunciationUk');
	}
}

function getYoudaoAudioAccent(
	element: Element,
	index: number,
): PronunciationAudio['accent'] {
	const text = getAudioContextText(element);
	if (text.includes('美') || text.includes('us') || text.includes('american')) {
		return 'us';
	}
	if (text.includes('英') || text.includes('uk') || text.includes('british')) {
		return 'uk';
	}
	return index === 1 ? 'us' : 'uk';
}

function getBingAudioAccent(
	element: Element,
	index: number,
): PronunciationAudio['accent'] {
	const text = getAudioContextText(element);
	if (text.includes('美') || text.includes('us') || text.includes('american')) {
		return 'us';
	}
	if (text.includes('英') || text.includes('uk') || text.includes('british')) {
		return 'uk';
	}
	return index === 1 ? 'us' : 'uk';
}

function getCambridgeAudioAccent(
	parentText: string,
	url: string,
	index: number,
): PronunciationAudio['accent'] {
	const text = `${parentText} ${url}`.toLowerCase();
	if (text.includes('us') || text.includes('american')) {
		return 'us';
	}
	if (text.includes('uk') || text.includes('british')) {
		return 'uk';
	}
	return index === 1 ? 'us' : 'uk';
}

function getAudioContextText(element: Element) {
	return [
		element.getAttribute('title') ?? '',
		element.getAttribute('aria-label') ?? '',
		getNormalizedText(element),
		getNormalizedText(element.parentElement),
	]
		.join(' ')
		.toLowerCase();
}

function getNearbyPhonetic(element: Element) {
	const candidates = [
		getNormalizedText(element.closest('.phonetic, .hd_area, .pos-header')),
		getNormalizedText(element.parentElement),
		getNormalizedText(element.previousElementSibling),
		getNormalizedText(element.nextElementSibling),
	];
	for (const candidate of candidates) {
		const phonetic = matchBracketedPhonetic(candidate);
		if (phonetic) {
			return phonetic;
		}
	}
	return '';
}

function matchQuotedUrl(text: string) {
	return /['"]([^'"]+\.(?:mp3|wav)(?:\?[^'"]*)?)['"]/i.exec(text)?.[1] ?? '';
}

function getAbsoluteDictionaryUrl(url: string, baseUrl: string) {
	const trimmed = url.trim();
	if (!trimmed || trimmed.startsWith('javascript:')) {
		return '';
	}
	try {
		return new URL(trimmed, baseUrl).toString();
	} catch {
		return '';
	}
}

function getNormalizedText(element: Element | null) {
	return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function getYoudaoInput(text: string) {
	if (text.length <= 20) {
		return text;
	}
	return `${text.slice(0, 10)}${text.length}${text.slice(-10)}`;
}

function createSalt() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sha256(text: string) {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(text),
	);
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');
}

function md5(input: string) {
	const bytes = new TextEncoder().encode(input);
	const bitLength = bytes.length * 8;
	const paddedLength = (((bytes.length + 8) >>> 6) + 1) << 6;
	const buffer = new Uint8Array(paddedLength);
	buffer.set(bytes);
	buffer[bytes.length] = 0x80;

	const view = new DataView(buffer.buffer);
	view.setUint32(paddedLength - 8, bitLength >>> 0, true);
	view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	const shifts = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
		5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
		4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
	];
	const constants = Array.from({ length: 64 }, (_, index) =>
		Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000),
	);

	for (let offset = 0; offset < buffer.length; offset += 64) {
		const words = Array.from({ length: 16 }, (_, index) =>
			view.getUint32(offset + index * 4, true),
		);
		let a = a0;
		let b = b0;
		let c = c0;
		let d = d0;

		for (let index = 0; index < 64; index += 1) {
			let f: number;
			let g: number;

			if (index < 16) {
				f = (b & c) | (~b & d);
				g = index;
			} else if (index < 32) {
				f = (d & b) | (~d & c);
				g = (5 * index + 1) % 16;
			} else if (index < 48) {
				f = b ^ c ^ d;
				g = (3 * index + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * index) % 16;
			}

				const next = d;
				const constant = constants[index];
				const word = words[g];
				const shift = shifts[index];
				if (
					constant === undefined ||
					word === undefined ||
					shift === undefined
				) {
					throw new Error('Invalid MD5 state.');
				}
				d = c;
				c = b;
				b =
					(b +
						leftRotate((a + f + constant + word) >>> 0, shift)) >>>
					0;
				a = next;
			}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	return [a0, b0, c0, d0].map(wordToHex).join('');
}

function leftRotate(value: number, shift: number) {
	return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function wordToHex(value: number) {
	return Array.from({ length: 4 }, (_, index) =>
		((value >>> (index * 8)) & 0xff).toString(16).padStart(2, '0'),
	).join('');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function getTranslationProviderName(provider: TranslationProviderId) {
	switch (provider) {
		case 'openai':
			return 'OpenAI-compatible';
		case 'microsoft':
			return 'Bing Translate (Microsoft Translator)';
		case 'google':
			return 'Google Cloud Translation';
		case 'deepl':
			return 'DeepL';
		case 'baidu':
			return 'Baidu Translate';
		case 'youdao':
			return 'Youdao Translate';
		case 'dictionary':
			return 'Dictionary';
	}
}
