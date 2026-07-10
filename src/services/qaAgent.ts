import {
	type ChatClientConfig,
	type ChatMessage,
	type ChatRequestOptions,
	requestChatText,
} from './openAIChatClient';
import { AgentLoop } from './qa/agentLoop';
import type { QaToolActivityKind, QaToolSettings } from './qa/tools';

export interface QaAgentConfig {
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	temperature: number;
	/** System prompt template. May contain a `{selectedText}` placeholder. */
	systemPrompt: string;
	/**
	 * Optional web search configuration. When omitted or `enabled` is false the
	 * agent falls back to a single-turn chat and never emits `tools` in the
	 * request body — preserving compatibility with models that don't support
	 * OpenAI tool_calls.
	 */
	webSearch?: QaWebSearchConfig;
}

export interface QaWebSearchConfig {
	enabled: boolean;
	settings: QaToolSettings;
	maxIterations: number;
}

export interface QaTurn {
	role: 'user' | 'assistant';
	content: string;
}

export interface QaAskOptions extends ChatRequestOptions {
	/** Fired when the loop starts a tool (search / fetch). Ignored when web search is disabled. */
	onToolActivity?: (kind: QaToolActivityKind, detail: string) => void;
}

/**
 * Number of most recent user/assistant rounds retained as context. Older turns
 * are dropped by {@link trimHistory}. Kept as a fixed MVP constant per the
 * product decision to avoid settings bloat.
 */
export const MAX_HISTORY_PAIRS = 6;

/**
 * Q&A agent: holds a per-selection conversation (a system message built from
 * the selected text plus recent user/assistant turns) and dispatches asks to
 * either a single chat completion (default) or an {@link AgentLoop} with web
 * search / fetch tools (when {@link QaAgentConfig.webSearch}.enabled is true).
 *
 * The stored `messages` array only ever contains the system message plus
 * final user/assistant turns. Intermediate tool_calls / tool messages produced
 * during an AgentLoop run are discarded so multi-turn history doesn't blow up.
 */
export class QaAgentService {
	private messages: ChatMessage[] = [];

	/** Rebuild the system message for a new selected text and drop all history. */
	reset(selectedText: string, config: QaAgentConfig): void {
		this.messages = [
			{
				role: 'system',
				content: fillPrompt(config.systemPrompt, selectedText),
			},
		];
	}

	/** Drop the conversation history but keep the system message. */
	clear(): void {
		this.messages = this.messages.filter((message) => message.role === 'system');
	}

	/** Return the conversation turns (without the system message) for UI rebuild. */
	getHistory(): QaTurn[] {
		return this.messages
			.filter((message) => message.role !== 'system')
			.map((message) => ({
				role: message.role as 'user' | 'assistant',
				content: message.content,
			}));
	}

	/**
	 * Ask a question, streaming the answer via `options.onChunk` when provided.
	 *
	 * Trimming runs AFTER the assistant reply is appended, so `trimHistory` only
	 * ever sees complete user/assistant rounds and the kept context can never
	 * start with an orphan assistant message.
	 */
	async ask(
		question: string,
		config: QaAgentConfig,
		options: QaAskOptions = {},
	): Promise<string> {
		// Fresh array handed to the client; this.messages is only updated after
		// the request resolves so an abort/error leaves prior history intact.
		const requestMessages: ChatMessage[] = [
			...this.messages,
			{ role: 'user', content: question },
		];

		const answer = await runAsk(question, requestMessages, config, options);

		this.messages = trimHistory([
			...requestMessages,
			{ role: 'assistant', content: answer },
		]);
		return answer;
	}
}

async function runAsk(
	_question: string,
	requestMessages: ChatMessage[],
	config: QaAgentConfig,
	options: QaAskOptions,
): Promise<string> {
	const webSearch = config.webSearch;
	if (!webSearch || !webSearch.enabled) {
		// Fast path preserves the pre-AgentLoop wire format (no tools field at all).
		return requestChatText(requestMessages, toClientConfig(config), options);
	}
	const loop = new AgentLoop();
	const result = await loop.run(
		requestMessages,
		{
			chat: toClientConfig(config),
			webSearch: {
				enabled: true,
				settings: webSearch.settings,
			},
			maxIterations: webSearch.maxIterations,
		},
		{
			signal: options.signal,
			onAnswerChunk: options.onChunk,
			onToolActivity: options.onToolActivity,
		},
	);
	return result.answer;
}

/**
 * Replace the `{selectedText}` placeholder in a prompt template with the
 * selected text. When the template has no placeholder, the selected text is
 * appended as a fenced block so the model still receives it.
 */
export function fillPrompt(template: string, selectedText: string): string {
	if (template.includes('{selectedText}')) {
		return template.replaceAll('{selectedText}', selectedText);
	}
	return `${template}\n\nSelected text:\n\`\`\`\n${selectedText}\n\`\`\``;
}

/**
 * Keep the system message(s) plus the most recent {@link MAX_HISTORY_PAIRS}
 * user/assistant rounds, dropping older conversation turns.
 */
export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
	const system = messages.filter((message) => message.role === 'system');
	const conversation = messages.filter(
		(message) => message.role !== 'system',
	);
	const maxConversation = MAX_HISTORY_PAIRS * 2;
	const trimmed = conversation.slice(-maxConversation);
	return [...system, ...trimmed];
}

function toClientConfig(config: QaAgentConfig): ChatClientConfig {
	return {
		apiBaseUrl: config.apiBaseUrl,
		apiKey: config.apiKey,
		model: config.model,
		temperature: config.temperature,
	};
}
