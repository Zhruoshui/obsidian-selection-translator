import { requestUrl } from 'obsidian';
import { t } from '../i18n';

export interface ChatClientConfig {
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	temperature: number;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

export interface ChatRequestOptions {
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
	maxTokens?: number;
}

interface ChatCompletionRequest {
	model: string;
	messages: ChatMessage[];
	temperature: number;
	stream?: boolean;
	max_tokens?: number;
}

/**
 * Shared low-level OpenAI-compatible chat completions client. It is config
 * driven and free of translation semantics so both the translation path and the
 * Q&A agent can reuse the same HTTP / streaming / error-handling logic.
 *
 * Streaming is used when `options.onChunk` is provided (via `window.fetch`);
 * otherwise a non-streaming request is sent via `requestUrl`. The streaming
 * path falls back to the non-streaming request when `window.fetch` itself fails
 * for a non-abort reason, mirroring the original translation behaviour.
 */
export async function requestChatCompletion(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions = {},
): Promise<string> {
	if (options.onChunk) {
		return fetchStreamingCompletion(messages, config, options);
	}
	return requestNonStreamingCompletion(messages, config, options);
}

export async function testChatConnection(
	config: ChatClientConfig,
): Promise<void> {
	validateConfig(config);

	const response = await requestUrl({
		url: buildChatCompletionsUrl(config.apiBaseUrl),
		method: 'POST',
		headers: buildHeaders(config),
		body: JSON.stringify(buildTestRequestBody(config)),
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		throw createStatusError(
			response.status,
			getProviderError(response.json, response.text),
		);
	}
}

export function validateConfig(config: ChatClientConfig) {
	if (!config.apiBaseUrl.trim()) {
		throw new Error(t('providerMissingApiBaseUrl'));
	}
	if (!config.apiKey.trim()) {
		throw new Error(t('providerMissingApiKey'));
	}
	if (!config.model.trim()) {
		throw new Error(t('providerMissingModel'));
	}
}

async function requestNonStreamingCompletion(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions,
): Promise<string> {
	const response = await requestUrl({
		url: buildChatCompletionsUrl(config.apiBaseUrl),
		method: 'POST',
		headers: buildHeaders(config),
		body: JSON.stringify(
			buildRequestBody(messages, config, false, options.maxTokens),
		),
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		throw createStatusError(
			response.status,
			getProviderError(response.json, response.text),
		);
	}

	const content = getAssistantMessage(response.json);
	if (!content) {
		throw new Error(t('providerMissingTranslatedText'));
	}

	return content.trim();
}

async function fetchStreamingCompletion(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions,
): Promise<string> {
	let response: Response;
	try {
		response = await window.fetch(buildChatCompletionsUrl(config.apiBaseUrl), {
			method: 'POST',
			headers: buildHeaders(config),
			body: JSON.stringify(
				buildRequestBody(messages, config, true, options.maxTokens),
			),
			signal: options.signal,
		});
	} catch (error) {
		if (options.signal?.aborted) {
			throw error;
		}
		return requestNonStreamingCompletion(messages, config, options);
	}

	if (!response.ok) {
		throw createStatusError(
			response.status,
			await getFetchProviderError(response),
		);
	}

	if (!response.body) {
		return parseNonStreamingResponse(await response.text());
	}

	return readStreamingResponse(response.body, options.onChunk);
}

function buildRequestBody(
	messages: ChatMessage[],
	config: ChatClientConfig,
	stream: boolean,
	maxTokens?: number,
): ChatCompletionRequest {
	const body: ChatCompletionRequest = {
		model: config.model.trim(),
		messages,
		temperature: config.temperature,
		stream,
	};
	if (maxTokens !== undefined) {
		body.max_tokens = maxTokens;
	}
	return body;
}

function buildTestRequestBody(config: ChatClientConfig): ChatCompletionRequest {
	return {
		model: config.model.trim(),
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

function buildHeaders(config: ChatClientConfig) {
	return {
		Authorization: `Bearer ${config.apiKey}`,
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

function createStatusError(status: number, message: string) {
	const error = new Error(message) as Error & { cause?: { status: number } };
	error.cause = { status };
	return error;
}
