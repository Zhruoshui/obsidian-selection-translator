import { requestUrl } from 'obsidian';
import { t } from '../i18n';

export interface ChatClientConfig {
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	temperature: number;
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		/** Raw JSON string as returned by the model; not parsed here. */
		arguments: string;
	};
}

export interface ChatMessage {
	role: ChatRole;
	content: string;
	/** Optional message-level `name` (kept for future extensibility). */
	name?: string;
	/** Required when `role === 'tool'`: the id of the assistant `tool_calls[i]`. */
	tool_call_id?: string;
	/** Set on `role === 'assistant'` messages that requested tool invocations. */
	tool_calls?: ChatToolCall[];
}

export interface ChatTool {
	type: 'function';
	function: {
		name: string;
		description: string;
		/** JSON Schema describing the arguments the model is asked to produce. */
		parameters: Record<string, unknown>;
	};
}

export type ChatToolChoice = 'auto' | 'none';

export interface ChatRequestOptions {
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
	/**
	 * Fired once per fully-assembled tool call. In streaming mode this fires when
	 * the stream ends; non-streaming responses are considered "fully assembled"
	 * on return and each call fires exactly once too.
	 */
	onToolCall?: (toolCall: ChatToolCall) => void;
	maxTokens?: number;
	tools?: ChatTool[];
	toolChoice?: ChatToolChoice;
}

export interface ChatCompletionResult {
	/** Assistant text. May be empty when the model chose to only call tools. */
	content: string;
	/** Complete tool call list assembled from either streaming or non-streaming response. */
	toolCalls: ChatToolCall[];
	finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter' | null;
}

interface ChatCompletionRequest {
	model: string;
	messages: ChatMessage[];
	temperature: number;
	stream?: boolean;
	max_tokens?: number;
	tools?: ChatTool[];
	tool_choice?: ChatToolChoice;
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
 *
 * Returns a {@link ChatCompletionResult} carrying both `content` and any
 * `tool_calls` the model produced. Callers that only want the text can use
 * {@link requestChatText}.
 */
export async function requestChatCompletion(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions = {},
): Promise<ChatCompletionResult> {
	if (options.onChunk) {
		return fetchStreamingCompletion(messages, config, options);
	}
	return requestNonStreamingCompletion(messages, config, options);
}

/**
 * Convenience wrapper for the legacy call sites (translation pipeline, the
 * previous single-turn Q&A path, tests) that only care about the final
 * assistant text. Throws when the model returned no text — matching the
 * pre-refactor behaviour.
 */
export async function requestChatText(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions = {},
): Promise<string> {
	const result = await requestChatCompletion(messages, config, options);
	if (!result.content) {
		throw new Error(t('providerMissingTranslatedText'));
	}
	return result.content;
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
): Promise<ChatCompletionResult> {
	const response = await requestUrl({
		url: buildChatCompletionsUrl(config.apiBaseUrl),
		method: 'POST',
		headers: buildHeaders(config),
		body: JSON.stringify(buildRequestBody(messages, config, false, options)),
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		throw createStatusError(
			response.status,
			getProviderError(response.json, response.text),
		);
	}

	const result = parseNonStreamingCompletion(response.json);
	fireToolCallCallbacks(result.toolCalls, options.onToolCall);
	return result;
}

async function fetchStreamingCompletion(
	messages: ChatMessage[],
	config: ChatClientConfig,
	options: ChatRequestOptions,
): Promise<ChatCompletionResult> {
	let response: Response;
	try {
		response = await window.fetch(buildChatCompletionsUrl(config.apiBaseUrl), {
			method: 'POST',
			headers: buildHeaders(config),
			body: JSON.stringify(buildRequestBody(messages, config, true, options)),
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
		const text = await response.text();
		const parsed = parseNonStreamingCompletion(parseJson(text));
		if (!parsed.content && parsed.toolCalls.length === 0) {
			throw new Error(t('providerMissingTranslatedText'));
		}
		if (parsed.content) {
			options.onChunk?.(parsed.content);
		}
		fireToolCallCallbacks(parsed.toolCalls, options.onToolCall);
		return parsed;
	}

	return readStreamingResponse(response.body, options);
}

function buildRequestBody(
	messages: ChatMessage[],
	config: ChatClientConfig,
	stream: boolean,
	options: ChatRequestOptions,
): ChatCompletionRequest {
	const body: ChatCompletionRequest = {
		model: config.model.trim(),
		messages,
		temperature: config.temperature,
		stream,
	};
	if (options.maxTokens !== undefined) {
		body.max_tokens = options.maxTokens;
	}
	if (options.tools && options.tools.length > 0) {
		body.tools = options.tools;
		body.tool_choice = options.toolChoice ?? 'auto';
	} else if (options.toolChoice) {
		// Rarely useful without tools, but keep it consistent for callers.
		body.tool_choice = options.toolChoice;
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
	options: ChatRequestOptions,
): Promise<ChatCompletionResult> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let content = '';
	const toolCallAcc = new ToolCallsAccumulator();
	let finishReason: ChatCompletionResult['finishReason'] = null;
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
			if (parsed.finishReason) {
				finishReason = parsed.finishReason;
			}
			if (parsed.content) {
				content += parsed.content;
				options.onChunk?.(parsed.content);
			}
			if (parsed.toolCallDeltas) {
				toolCallAcc.applyDeltas(parsed.toolCallDeltas);
			}
		}
	}

	buffer += decoder.decode();
	if (buffer.trim()) {
		const parsed = parseStreamEvent(buffer);
		if (parsed.finishReason) {
			finishReason = parsed.finishReason;
		}
		if (parsed.content) {
			content += parsed.content;
			options.onChunk?.(parsed.content);
		}
		if (parsed.toolCallDeltas) {
			toolCallAcc.applyDeltas(parsed.toolCallDeltas);
		}
		if (
			!content &&
			toolCallAcc.isEmpty() &&
			!parsed.content &&
			!parsed.toolCallDeltas
		) {
			// Non-SSE fallback: server may have returned a whole JSON body inside a
			// single "chunk". Try to parse it like a non-streaming completion.
			const fallback = parseNonStreamingCompletion(parseJson(buffer));
			if (fallback.content) {
				content = fallback.content;
				options.onChunk?.(fallback.content);
			}
			for (const tc of fallback.toolCalls) {
				toolCallAcc.setFromCompleted(tc);
			}
			if (fallback.finishReason) {
				finishReason = fallback.finishReason;
			}
		}
	}

	const toolCalls = toolCallAcc.toArray();
	if (!content.trim() && toolCalls.length === 0) {
		throw new Error(t('providerMissingTranslatedText'));
	}

	fireToolCallCallbacks(toolCalls, options.onToolCall);

	return {
		content: content.trim(),
		toolCalls,
		finishReason,
	};
}

interface StreamEvent {
	done: boolean;
	content: string;
	toolCallDeltas?: ToolCallDelta[];
	finishReason?: ChatCompletionResult['finishReason'];
}

interface ToolCallDelta {
	index: number;
	id?: string;
	name?: string;
	argumentsChunk?: string;
}

function parseStreamEvent(event: string): StreamEvent {
	let content = '';
	let toolCallDeltas: ToolCallDelta[] | undefined;
	let finishReason: ChatCompletionResult['finishReason'] | undefined;

	for (const line of event.split(/\r?\n/)) {
		if (!line.startsWith('data:')) {
			continue;
		}

		const data = line.slice(5).trim();
		if (!data) {
			continue;
		}
		if (data === '[DONE]') {
			return { content, done: true, toolCallDeltas, finishReason };
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
		const deltas = getStreamingToolCallDeltas(parsed);
		if (deltas.length > 0) {
			(toolCallDeltas ??= []).push(...deltas);
		}
		const reason = getStreamingFinishReason(parsed);
		if (reason) {
			finishReason = reason;
		}
	}

	return { content, done: false, toolCallDeltas, finishReason };
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

function getStreamingToolCallDeltas(json: unknown): ToolCallDelta[] {
	if (!isRecord(json)) {
		return [];
	}
	const choices: unknown = json.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return [];
	}
	const firstChoice: unknown = choices[0];
	if (!isRecord(firstChoice)) {
		return [];
	}
	const delta: unknown = firstChoice.delta;
	if (!isRecord(delta)) {
		return [];
	}
	const rawToolCalls: unknown = delta.tool_calls;
	if (!Array.isArray(rawToolCalls)) {
		return [];
	}
	const result: ToolCallDelta[] = [];
	for (const raw of rawToolCalls) {
		if (!isRecord(raw)) {
			continue;
		}
		const indexRaw: unknown = raw.index;
		const index =
			typeof indexRaw === 'number' && Number.isInteger(indexRaw) ? indexRaw : 0;
		const delta: ToolCallDelta = { index };
		if (typeof raw.id === 'string' && raw.id) {
			delta.id = raw.id;
		}
		const fn: unknown = raw.function;
		if (isRecord(fn)) {
			if (typeof fn.name === 'string' && fn.name) {
				delta.name = fn.name;
			}
			if (typeof fn.arguments === 'string') {
				delta.argumentsChunk = fn.arguments;
			}
		}
		result.push(delta);
	}
	return result;
}

function getStreamingFinishReason(
	json: unknown,
): ChatCompletionResult['finishReason'] | undefined {
	if (!isRecord(json)) {
		return undefined;
	}
	const choices: unknown = json.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return undefined;
	}
	const firstChoice: unknown = choices[0];
	if (!isRecord(firstChoice)) {
		return undefined;
	}
	const reason: unknown = firstChoice.finish_reason;
	return normalizeFinishReason(reason);
}

function normalizeFinishReason(
	value: unknown,
): ChatCompletionResult['finishReason'] | undefined {
	switch (value) {
		case 'stop':
		case 'tool_calls':
		case 'length':
		case 'content_filter':
			return value;
		default:
			return undefined;
	}
}

/**
 * Assembles streamed tool call deltas into complete {@link ChatToolCall} objects
 * indexed by the `index` field the API attaches to every chunk.
 */
class ToolCallsAccumulator {
	private readonly byIndex = new Map<number, ChatToolCall>();

	applyDeltas(deltas: ToolCallDelta[]): void {
		for (const delta of deltas) {
			const existing = this.byIndex.get(delta.index);
			const merged: ChatToolCall = existing ?? {
				id: '',
				type: 'function',
				function: { name: '', arguments: '' },
			};
			if (delta.id) {
				merged.id = delta.id;
			}
			if (delta.name) {
				merged.function.name = delta.name;
			}
			if (delta.argumentsChunk) {
				merged.function.arguments += delta.argumentsChunk;
			}
			this.byIndex.set(delta.index, merged);
		}
	}

	setFromCompleted(toolCall: ChatToolCall): void {
		this.byIndex.set(this.byIndex.size, {
			id: toolCall.id,
			type: 'function',
			function: {
				name: toolCall.function.name,
				arguments: toolCall.function.arguments,
			},
		});
	}

	isEmpty(): boolean {
		return this.byIndex.size === 0;
	}

	toArray(): ChatToolCall[] {
		return [...this.byIndex.keys()]
			.sort((a, b) => a - b)
			.map((index) => {
				const tc = this.byIndex.get(index);
				if (!tc) {
					// Defensive: keys() came from the same map, this can't happen at
					// runtime, but the type system needs a value.
					throw new Error('tool call index missing');
				}
				return tc;
			})
			.filter((tc) => tc.function.name.length > 0);
	}
}

function parseNonStreamingCompletion(json: unknown): ChatCompletionResult {
	if (!isRecord(json)) {
		return { content: '', toolCalls: [], finishReason: null };
	}
	const choices: unknown = json.choices;
	if (!Array.isArray(choices) || choices.length === 0) {
		return { content: '', toolCalls: [], finishReason: null };
	}
	const firstChoice: unknown = choices[0];
	if (!isRecord(firstChoice)) {
		return { content: '', toolCalls: [], finishReason: null };
	}
	const message: unknown = firstChoice.message;
	let content = '';
	let toolCalls: ChatToolCall[] = [];
	if (isRecord(message)) {
		if (typeof message.content === 'string') {
			content = message.content.trim();
		}
		toolCalls = extractToolCalls(message.tool_calls);
	}
	const finishReason = normalizeFinishReason(firstChoice.finish_reason) ?? null;
	return { content, toolCalls, finishReason };
}

function extractToolCalls(raw: unknown): ChatToolCall[] {
	if (!Array.isArray(raw)) {
		return [];
	}
	const out: ChatToolCall[] = [];
	for (const entry of raw) {
		if (!isRecord(entry)) {
			continue;
		}
		const id = typeof entry.id === 'string' ? entry.id : '';
		const fn: unknown = entry.function;
		if (!isRecord(fn)) {
			continue;
		}
		const name = typeof fn.name === 'string' ? fn.name : '';
		const args = typeof fn.arguments === 'string' ? fn.arguments : '';
		if (!name) {
			continue;
		}
		out.push({
			id,
			type: 'function',
			function: { name, arguments: args },
		});
	}
	return out;
}

function fireToolCallCallbacks(
	toolCalls: ChatToolCall[],
	callback?: (toolCall: ChatToolCall) => void,
) {
	if (!callback || toolCalls.length === 0) {
		return;
	}
	for (const tc of toolCalls) {
		callback(tc);
	}
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
