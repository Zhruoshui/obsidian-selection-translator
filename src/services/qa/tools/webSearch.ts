import { t } from '../../../i18n';
import { createSearchProvider, type SearchResult } from '../search';
import {
	toolErrorMessage,
	type QaTool,
	type QaToolContext,
} from './index';

export const webSearchTool: QaTool = {
	name: 'web_search',
	description:
		'Search the public web for up-to-date information. Use this before answering ' +
		'questions that depend on recent events, current facts, or anything outside your ' +
		'built-in knowledge. Returns a numbered list of results with title, url, and snippet. ' +
		'Follow up with fetch_url when the snippet is not enough.',
	parameters: {
		type: 'object',
		properties: {
			query: {
				type: 'string',
				description: 'Concise web search query in the same language as the answer.',
			},
		},
		required: ['query'],
		additionalProperties: false,
	},
	async execute(args, ctx: QaToolContext): Promise<string> {
		const query = extractQuery(args);
		if (!query) {
			return toolErrorMessage(t('qaSearchEmptyQuery'));
		}
		ctx.onActivity('search', query);
		try {
			const provider = createSearchProvider(ctx.settings.search);
			const results = await provider.search(query, {
				limit: ctx.settings.searchResultLimit,
				signal: ctx.signal,
			});
			if (results.length === 0) {
				return t('qaSearchNoResults');
			}
			return formatResults(results);
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}
			return toolErrorMessage(getErrorMessage(error));
		}
	},
};

function extractQuery(args: unknown): string {
	if (typeof args !== 'object' || args === null) {
		return '';
	}
	const value = (args as Record<string, unknown>).query;
	return typeof value === 'string' ? value.trim() : '';
}

function formatResults(results: SearchResult[]): string {
	return results
		.map((r, idx) => {
			const parts = [`[${idx + 1}] ${r.title || r.url}`, r.url];
			if (r.snippet) {
				parts.push(r.snippet);
			}
			return parts.join('\n');
		})
		.join('\n\n');
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}
