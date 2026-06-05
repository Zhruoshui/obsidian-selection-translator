import { requestUrl } from 'obsidian';
import { t } from '../i18n';
import {
	DEFAULT_SETTINGS,
	type SelectionTranslatorSettings,
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

export class TranslationService {
	private readonly openAI = new OpenAICompatibleChatService();

	async translate(
		text: string,
		settings: SelectionTranslatorSettings,
		options: TranslationRequestOptions = {},
	) {
		if (isDictionaryLookupText(text)) {
			return translateWithDictionary(text);
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
	) {
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

async function translateWithDictionary(text: string): Promise<TranslationResult> {
	const word = normalizeDictionaryWord(text);
	const response = await requestUrl({
		url: `https://dict.cn/${encodeURIComponent(word)}`,
		method: 'GET',
		headers: {
			Accept: 'text/html',
		},
		throw: false,
	});
	ensureSuccessfulResponse(response.status, undefined, response.text);

	const result = parseDictCnDictionaryHtml(response.text);
	if (!result.text.trim()) {
		throw new Error(t('dictionaryNoResult'));
	}
	return result;
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

function parseDictCnDictionaryHtml(html: string): TranslationResult {
	const document = new DOMParser().parseFromString(html, 'text/html');
	for (const element of Array.from(document.querySelectorAll('script, style'))) {
		element.remove();
	}

	const audio = getDictCnPronunciationAudio(document);
	const definitionLines = getDictCnDefinitionLines(document);
	const lines = [
		...formatPronunciationAudioLines(audio),
		...definitionLines,
	];

	return {
		text: lines.join('\n').trim(),
		audio,
	};
}

function getDictCnPronunciationAudio(document: Document) {
	const audio: PronunciationAudio[] = [];
	const seenUrls = new Set<string>();
	const spans = Array.from(
		document.querySelectorAll<HTMLSpanElement>('div.phonetic > span'),
	);

	for (const [spanIndex, span] of spans.entries()) {
		const spanText = getDictCnPhoneticText(span);
		const phonetic = matchBracketedPhonetic(spanText);
		const buttons = Array.from(span.querySelectorAll<HTMLElement>('i[naudio]'));
		for (const button of buttons) {
			const audioPath = button.getAttribute('naudio')?.trim();
			if (!audioPath) {
				continue;
			}

			const url = getDictCnAudioUrl(audioPath);
			if (seenUrls.has(url)) {
				continue;
			}
			seenUrls.add(url);

			const accent = getDictCnAudioAccent(spanText, button.title, spanIndex);
			audio.push({
				accent,
				label: getPronunciationAccentLabel(accent, button.title),
				phonetic,
				url,
			});
		}
	}

	return audio;
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

function getDictCnDefinitionLines(document: Document) {
	return Array.from(
		document.querySelectorAll<HTMLLIElement>('ul.dict-basic-ul > li'),
	)
		.filter((element) => !element.querySelector('script'))
		.map((element) => getNormalizedText(element))
		.filter((line) => line.length > 0);
}

function getDictCnPhoneticText(span: HTMLSpanElement) {
	const clone = span.cloneNode(true);
	if (!clone.instanceOf(HTMLSpanElement)) {
		return getNormalizedText(span);
	}
	for (const audioButton of Array.from(clone.querySelectorAll('i'))) {
		audioButton.remove();
	}
	return getNormalizedText(clone);
}

function matchBracketedPhonetic(text: string) {
	return /\[([^\]]+)\]/.exec(text)?.[1]?.trim() ?? '';
}

function getDictCnAudioUrl(audioPath: string) {
	if (/^https?:\/\//i.test(audioPath)) {
		return audioPath;
	}
	return `https://audio.dict.cn/${audioPath.replace(/^\/+/, '')}`;
}

function getDictCnAudioAccent(
	spanText: string,
	title: string,
	spanIndex: number,
): PronunciationAudio['accent'] {
	const text = `${spanText} ${title}`.toLowerCase();
	if (text.includes('美') || text.includes('us') || text.includes('american')) {
		return 'us';
	}
	if (text.includes('英') || text.includes('uk') || text.includes('british')) {
		return 'uk';
	}
	return spanIndex === 1 ? 'us' : 'uk';
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
