import {
	type ChatClientConfig,
	type ChatMessage,
	type ChatRequestOptions,
	requestChatCompletion,
} from './openAIChatClient';

export interface QaAgentConfig {
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	temperature: number;
	/** System prompt template. May contain a `{selectedText}` placeholder. */
	systemPrompt: string;
}

export interface QaTurn {
	role: 'user' | 'assistant';
	content: string;
}

/**
 * Number of most recent user/assistant rounds retained as context. Older turns
 * are dropped by {@link trimHistory}. Kept as a fixed MVP constant per the
 * product decision to avoid settings bloat.
 */
export const MAX_HISTORY_PAIRS = 6;

/**
 * Simple built-in Q&A agent. It holds a per-selection conversation (a system
 * message built from the selected text plus recent user/assistant turns) and
 * delegates the actual chat completion to the shared OpenAI-compatible client.
 *
 * There is no tool-calling / ReAct loop and no web or vault search: the agent
 * only answers questions about the currently selected text.
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
	 * start with an orphan assistant message. The request itself is bounded
	 * because `this.messages` is already trimmed to the last
	 * {@link MAX_HISTORY_PAIRS} rounds from the previous turn.
	 */
	async ask(
		question: string,
		config: QaAgentConfig,
		options: ChatRequestOptions = {},
	): Promise<string> {
		// Fresh array handed to the client; this.messages is only updated after
		// the request resolves so an abort/error leaves prior history intact.
		const requestMessages: ChatMessage[] = [
			...this.messages,
			{ role: 'user', content: question },
		];

		const answer = await requestChatCompletion(
			requestMessages,
			toClientConfig(config),
			options,
		);

		this.messages = trimHistory([
			...requestMessages,
			{ role: 'assistant', content: answer },
		]);
		return answer;
	}
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
