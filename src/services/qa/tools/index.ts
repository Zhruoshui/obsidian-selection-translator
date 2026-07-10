import type { ChatTool } from '../../openAIChatClient';
import type { SearchProviderSettings } from '../search';
import { fetchUrlTool } from './fetchUrl';
import { webSearchTool } from './webSearch';

/**
 * Runtime configuration passed to every tool call. Kept intentionally small:
 * anything user-configurable (search backend, limits, truncation caps) is
 * folded into a plain object so the tools don't reach into settings directly.
 */
export interface QaToolSettings {
	search: SearchProviderSettings;
	searchResultLimit: number;
	fetchMaxChars: number;
}

export type QaToolActivityKind = 'search' | 'fetch';

export interface QaToolContext {
	signal: AbortSignal;
	settings: QaToolSettings;
	onActivity: (kind: QaToolActivityKind, detail: string) => void;
}

export interface QaTool {
	readonly name: string;
	readonly description: string;
	readonly parameters: Record<string, unknown>;
	/**
	 * Execute the tool. `args` is the raw parsed JSON. Return the string that
	 * will be handed back to the model as the `tool` message content. Errors
	 * should be returned as `[tool error] <message>` — throwing here will crash
	 * the loop. Aborts (DOMException 'AbortError') must be re-thrown.
	 */
	execute(args: unknown, ctx: QaToolContext): Promise<string>;
}

/** Convert one of our tools into the OpenAI-compatible `ChatTool` schema. */
export function toChatTool(tool: QaTool): ChatTool {
	return {
		type: 'function',
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
		},
	};
}

export const QA_TOOLS: QaTool[] = [webSearchTool, fetchUrlTool];

export function getToolByName(name: string): QaTool | undefined {
	return QA_TOOLS.find((tool) => tool.name === name);
}

export function toChatTools(): ChatTool[] {
	return QA_TOOLS.map(toChatTool);
}

/** Format a helper "tool error" string; kept in one place so wording is consistent. */
export function toolErrorMessage(message: string): string {
	return `[tool error] ${message}`;
}
