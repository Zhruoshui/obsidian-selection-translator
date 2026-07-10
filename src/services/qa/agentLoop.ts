import { t } from '../../i18n';
import {
	requestChatCompletion,
	type ChatClientConfig,
	type ChatMessage,
	type ChatToolCall,
} from '../openAIChatClient';
import {
	getToolByName,
	toChatTools,
	toolErrorMessage,
	type QaToolActivityKind,
	type QaToolSettings,
} from './tools';

/**
 * Runtime configuration for one Agent Loop run. When `webSearch.enabled` is
 * false, the loop degenerates to a single streaming chat request without any
 * `tools` payload — same wire format as before the feature existed.
 */
export interface AgentLoopConfig {
	chat: ChatClientConfig;
	webSearch: {
		enabled: boolean;
		settings: QaToolSettings;
	};
	/** Upper bound on intermediate (tool-executing) rounds. Final answer round is separate. */
	maxIterations: number;
}

export interface AgentLoopOptions {
	signal?: AbortSignal;
	/** Called with each chunk of the FINAL assistant answer only. Intermediate rounds are silent. */
	onAnswerChunk?: (chunk: string) => void;
	/** Fires when a tool is about to run (search query / fetch URL etc). */
	onToolActivity?: (kind: QaToolActivityKind, detail: string) => void;
}

export interface AgentLoopResult {
	/** Complete assistant answer text. */
	answer: string;
	/** Full transcript of the run (system + user + intermediate assistant/tool + final assistant). */
	transcript: ChatMessage[];
	/** How many tool-executing rounds actually ran. */
	iterations: number;
}

/**
 * Multi-round chat loop with OpenAI-compatible tool_calls. Callers pass a
 * pre-built messages array (system + user turn + prior history) and get back
 * the final assistant text plus the full transcript.
 *
 * ### State machine
 *
 * ```
 *   iter = 0
 *   while iter < maxIterations && webSearch.enabled:
 *     non-streaming chat with tools=[web_search, fetch_url], tool_choice=auto
 *     if response has no tool_calls:
 *       -> we're done, stream `content` back to UI in one shot and return
 *     else:
 *       execute each tool call in order, append assistant + tool messages
 *       iter++
 *   final round:
 *     streaming chat WITHOUT tools (tool_choice not set)
 *     -> stream chunks to UI, return content
 * ```
 *
 * Aborts (via `options.signal`) surface as DOMException 'AbortError' — the
 * caller is expected to swallow them next to the AbortController that fired.
 */
export class AgentLoop {
	async run(
		messages: ChatMessage[],
		config: AgentLoopConfig,
		options: AgentLoopOptions = {},
	): Promise<AgentLoopResult> {
		const signal = options.signal ?? new AbortController().signal;
		const transcript: ChatMessage[] = [...messages];
		const activity = options.onToolActivity ?? (() => {});

		// Fast path: web search disabled → the whole loop is one streaming chat.
		if (!config.webSearch.enabled) {
			const answer = await this.streamFinalAnswer(
				transcript,
				config.chat,
				options.onAnswerChunk,
				signal,
			);
			transcript.push({ role: 'assistant', content: answer });
			return { answer, transcript, iterations: 0 };
		}

		const tools = toChatTools();
		let iterations = 0;

		while (iterations < config.maxIterations) {
			throwIfAborted(signal);
			const result = await requestChatCompletion(transcript, config.chat, {
				signal,
				tools,
				toolChoice: 'auto',
			});

			// Push the assistant message. If the model produced content AND tool
			// calls simultaneously, we keep both so subsequent rounds have context.
			const assistantMessage: ChatMessage = {
				role: 'assistant',
				content: result.content,
			};
			if (result.toolCalls.length > 0) {
				assistantMessage.tool_calls = result.toolCalls;
			}
			transcript.push(assistantMessage);

			if (result.toolCalls.length === 0) {
				// Model chose to answer directly. Emit the whole content as one chunk
				// so the UI's streaming pipeline still sees it.
				const answer = result.content;
				if (answer) {
					options.onAnswerChunk?.(answer);
				}
				return { answer, transcript, iterations };
			}

			// Execute every tool call in order (parallel would break `onActivity`
			// ordering and isn't a common model behaviour anyway).
			for (const toolCall of result.toolCalls) {
				throwIfAborted(signal);
				const output = await this.executeToolCall(toolCall, {
					signal,
					settings: config.webSearch.settings,
					onActivity: activity,
				});
				transcript.push({
					role: 'tool',
					tool_call_id: toolCall.id,
					content: output,
				});
			}
			iterations += 1;
		}

		// Ran out of iterations — force a final streamed answer without tools.
		throwIfAborted(signal);
		const answer = await this.streamFinalAnswer(
			transcript,
			config.chat,
			options.onAnswerChunk,
			signal,
		);
		transcript.push({ role: 'assistant', content: answer });
		return { answer, transcript, iterations };
	}

	private async streamFinalAnswer(
		messages: ChatMessage[],
		config: ChatClientConfig,
		onAnswerChunk: ((chunk: string) => void) | undefined,
		signal: AbortSignal,
	): Promise<string> {
		const result = await requestChatCompletion(messages, config, {
			signal,
			onChunk: onAnswerChunk,
		});
		return result.content;
	}

	private async executeToolCall(
		toolCall: ChatToolCall,
		ctx: {
			signal: AbortSignal;
			settings: QaToolSettings;
			onActivity: (kind: QaToolActivityKind, detail: string) => void;
		},
	): Promise<string> {
		const tool = getToolByName(toolCall.function.name);
		if (!tool) {
			return toolErrorMessage(
				t('qaToolUnknownName', { name: toolCall.function.name }),
			);
		}
		let args: unknown = {};
		if (toolCall.function.arguments) {
			try {
				args = JSON.parse(toolCall.function.arguments);
			} catch (error) {
				return toolErrorMessage(
					t('qaToolInvalidArguments', {
						name: toolCall.function.name,
						message: error instanceof Error ? error.message : String(error),
					}),
				);
			}
		}
		try {
			return await tool.execute(args, ctx);
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}
			return toolErrorMessage(
				error instanceof Error ? error.message : String(error),
			);
		}
	}
}

function throwIfAborted(signal: AbortSignal) {
	if (signal.aborted) {
		throw new DOMException(t('qaLoopAborted'), 'AbortError');
	}
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}
