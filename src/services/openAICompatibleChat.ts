import { requestUrl } from 'obsidian';
import { t } from '../i18n';
import {
	DEFAULT_SETTINGS,
	type SelectionTranslatorSettings,
} from '../settings';

interface ChatMessage {
	role: 'system' | 'user';
	content: string;
}

interface ChatCompletionRequest {
	model: string;
	messages: ChatMessage[];
	temperature: number;
	stream?: boolean;
	max_tokens?: number;
}

interface TranslationRequestOptions {
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
}

export class OpenAICompatibleChatService {
	async translate(
		text: string,
		settings: SelectionTranslatorSettings,
		options: TranslationRequestOptions = {},
	) {
		validateSettings(settings);

		if (options.onChunk) {
			return fetchStreamingTranslation(text, settings, options);
		}

		return requestChatCompletion(text, settings);
	}

	async testConnection(settings: SelectionTranslatorSettings) {
		validateSettings(settings);

		const response = await requestUrl({
			url: buildChatCompletionsUrl(settings.apiBaseUrl),
			method: 'POST',
			headers: buildHeaders(settings),
			body: JSON.stringify(buildTestRequestBody(settings)),
			throw: false,
		});

		if (response.status < 200 || response.status >= 300) {
			throw new Error(getProviderError(response.json, response.text));
		}
	}
}

async function requestChatCompletion(
	text: string,
	settings: SelectionTranslatorSettings,
) {
	const response = await requestUrl({
		url: buildChatCompletionsUrl(settings.apiBaseUrl),
		method: 'POST',
		headers: buildHeaders(settings),
		body: JSON.stringify(buildRequestBody(text, settings)),
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		throw new Error(getProviderError(response.json, response.text));
	}

	const content = getAssistantMessage(response.json);
	if (!content) {
		throw new Error(t('providerMissingTranslatedText'));
	}

	return content.trim();
}

async function fetchStreamingTranslation(
	text: string,
	settings: SelectionTranslatorSettings,
	options: TranslationRequestOptions,
) {
	let response: Response;
	try {
		response = await window.fetch(buildChatCompletionsUrl(settings.apiBaseUrl), {
			method: 'POST',
			headers: buildHeaders(settings),
			body: JSON.stringify(buildRequestBody(text, settings, true)),
			signal: options.signal,
		});
	} catch (error) {
		if (options.signal?.aborted) {
			throw error;
		}
		return requestChatCompletion(text, settings);
	}

	if (!response.ok) {
		throw new Error(await getFetchProviderError(response));
	}

	if (!response.body) {
		return parseNonStreamingResponse(await response.text());
	}

	return readStreamingResponse(response.body, options.onChunk);
}

function validateSettings(settings: SelectionTranslatorSettings) {
	if (!settings.apiBaseUrl.trim()) {
		throw new Error(t('providerMissingApiBaseUrl'));
	}
	if (!settings.apiKey.trim()) {
		throw new Error(t('providerMissingApiKey'));
	}
	if (!settings.model.trim()) {
		throw new Error(t('providerMissingModel'));
	}
}

function buildRequestBody(
	text: string,
	settings: SelectionTranslatorSettings,
	stream = false,
): ChatCompletionRequest {
	return {
		model: settings.model.trim(),
		messages: [
			{
				role: 'system',
				content: buildPrompt(settings),
			},
			{
				role: 'user',
				content: text,
			},
		],
		temperature: settings.temperature,
		stream,
	};
}

function buildTestRequestBody(
	settings: SelectionTranslatorSettings,
): ChatCompletionRequest {
	return {
		model: settings.model.trim(),
		messages: [
			{
				role: 'system',
				content: 'Reply with OK.',
			},
			{
				role: 'user',
				content: 'OK',
			},
		],
		temperature: 0,
		max_tokens: 8,
	};
}

function buildPrompt(settings: SelectionTranslatorSettings) {
	const sourceLanguage = getPromptSourceLanguage(settings.sourceLanguage);
	const targetLanguage =
		settings.targetLanguage.trim() || DEFAULT_SETTINGS.targetLanguage;
	const missingDirectives: string[] = [];

	if (!settings.prompt.includes('{sourceLanguage}')) {
		missingDirectives.push(`Source language: ${sourceLanguage}`);
	}
	if (!settings.prompt.includes('{targetLanguage}')) {
		missingDirectives.push(`Target language: ${targetLanguage}`);
	}

	const prompt = settings.prompt
		.replaceAll('{sourceLanguage}', sourceLanguage)
		.replaceAll('{targetLanguage}', targetLanguage);

	if (missingDirectives.length === 0) {
		return prompt;
	}

	return `${missingDirectives.join('\n')}\n\n${prompt}`;
}

function getPromptSourceLanguage(sourceLanguage: string) {
	const normalized = sourceLanguage.trim();
	if (!normalized || normalized.toLowerCase() === 'auto') {
		return 'the auto-detected source language';
	}
	return normalized;
}

function buildHeaders(settings: SelectionTranslatorSettings) {
	return {
		Authorization: `Bearer ${settings.apiKey}`,
		'Content-Type': 'application/json',
	};
}

function buildChatCompletionsUrl(baseUrl: string) {
	const trimmed = baseUrl.trim().replace(/\/+$/, '');
	if (trimmed.endsWith('/chat/completions')) {
		return trimmed;
	}
	return `${trimmed}/chat/completions`;
}

async function readStreamingResponse(
	body: ReadableStream<Uint8Array>,
	onChunk?: (chunk: string) => void,
) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let result = '';
	let done = false;

	while (!done) {
		const readResult = await reader.read();
		if (readResult.done) {
			break;
		}

		buffer += decoder.decode(readResult.value, { stream: true });
		const events = buffer.split(/\r?\n\r?\n/);
		buffer = events.pop() ?? '';

		for (const event of events) {
			const parsed = parseStreamEvent(event);
			if (parsed.done) {
				done = true;
				break;
			}
			if (parsed.content) {
				result += parsed.content;
				onChunk?.(parsed.content);
			}
		}
	}

	buffer += decoder.decode();
	if (buffer.trim()) {
		const parsed = parseStreamEvent(buffer);
		if (parsed.content) {
			result += parsed.content;
			onChunk?.(parsed.content);
		} else if (!result) {
			const fallbackContent = getAssistantMessage(parseJson(buffer));
			if (fallbackContent) {
				result = fallbackContent;
				onChunk?.(fallbackContent);
			}
		}
	}

	if (!result.trim()) {
		throw new Error(t('providerMissingTranslatedText'));
	}

	return result.trim();
}

function parseStreamEvent(event: string) {
	let content = '';

	for (const line of event.split(/\r?\n/)) {
		if (!line.startsWith('data:')) {
			continue;
		}

		const data = line.slice(5).trim();
		if (!data) {
			continue;
		}
		if (data === '[DONE]') {
			return { content, done: true };
		}

		const parsed = parseJson(data);
		if (isRecord(parsed) && isRecord(parsed.error)) {
			const message: unknown = parsed.error.message;
			throw new Error(
				typeof message === 'string' && message.trim()
					? message
					: t('providerRequestFailed'),
			);
		}

		content += getStreamingContent(parsed);
	}

	return { content, done: false };
}

function getStreamingContent(json: unknown) {
	if (!isRecord(json)) {
		return '';
	}

	const choices: unknown = json.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return '';
	}

	const firstChoice: unknown = choices[0];
	if (!isRecord(firstChoice)) {
		return '';
	}

	if (isRecord(firstChoice.delta)) {
		const deltaContent: unknown = firstChoice.delta.content;
		if (typeof deltaContent === 'string') {
			return deltaContent;
		}
	}

	if (isRecord(firstChoice.message)) {
		const messageContent: unknown = firstChoice.message.content;
		if (typeof messageContent === 'string') {
			return messageContent;
		}
	}

	return '';
}

function parseNonStreamingResponse(text: string) {
	const content = getAssistantMessage(parseJson(text));
	if (!content) {
		throw new Error(t('providerMissingTranslatedText'));
	}
	return content.trim();
}

function getAssistantMessage(json: unknown) {
	if (!isRecord(json)) {
		return undefined;
	}

	const choices: unknown = json.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return undefined;
	}

	const firstChoice: unknown = choices[0];
	if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
		return undefined;
	}

	const content: unknown = firstChoice.message.content;
	return typeof content === 'string' ? content : undefined;
}

async function getFetchProviderError(response: Response) {
	const text = await response.text();
	return getProviderError(parseJson(text), text);
}

function getProviderError(json: unknown, text: string) {
	if (isRecord(json) && isRecord(json.error)) {
		const message: unknown = json.error.message;
		if (typeof message === 'string' && message.trim()) {
			return message;
		}
	}

	if (text.trim()) {
		return text.trim();
	}

	return t('providerRequestFailed');
}

function parseJson(text: string) {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
