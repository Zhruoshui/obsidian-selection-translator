import { requestUrl } from 'obsidian';
import { t } from '../../../i18n';
import {
	requireApiKey,
	type SearchOptions,
	type SearchProvider,
	type SearchResult,
} from './index';

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

/**
 * Tavily search API. Docs: https://docs.tavily.com/docs/rest-api/api-reference
 *
 * Body accepts `{api_key, query, max_results, search_depth: 'basic'|'advanced'}`
 * and returns `{results: [{title, url, content, ...}, ...]}`. The `content`
 * field is a short summary, mapped to our `snippet`.
 */
export function createTavilyProvider(apiKey: string): SearchProvider {
	return {
		id: 'tavily',
		async search(
			query: string,
			opts: SearchOptions,
		): Promise<SearchResult[]> {
			const key = requireApiKey(apiKey, 'Tavily');
			const response = await requestUrl({
				url: TAVILY_ENDPOINT,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					api_key: key,
					query,
					max_results: opts.limit,
					search_depth: 'basic',
				}),
				throw: false,
			});
			if (opts.signal?.aborted) {
				throw new DOMException(t('qaLoopAborted'), 'AbortError');
			}
			if (response.status < 200 || response.status >= 300) {
				throw new Error(
					t('qaSearchProviderFailed', {
						provider: 'Tavily',
						message: providerErrorMessage(response.json, response.text, response.status),
					}),
				);
			}
			return parseTavilyResults(response.json);
		},
	};
}

function parseTavilyResults(json: unknown): SearchResult[] {
	if (!isRecord(json)) {
		return [];
	}
	const results: unknown = json.results;
	if (!Array.isArray(results)) {
		return [];
	}
	const out: SearchResult[] = [];
	for (const entry of results) {
		if (!isRecord(entry)) {
			continue;
		}
		const title = stringOrEmpty(entry.title);
		const url = stringOrEmpty(entry.url);
		if (!url) {
			continue;
		}
		const snippet = stringOrEmpty(entry.content ?? entry.snippet);
		out.push({ title, url, snippet });
	}
	return out;
}

function stringOrEmpty(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function providerErrorMessage(json: unknown, text: string, status: number): string {
	if (isRecord(json)) {
		const detail: unknown = json.detail ?? json.error ?? json.message;
		if (typeof detail === 'string' && detail.trim()) {
			return detail.trim();
		}
	}
	if (text && text.trim()) {
		return text.trim();
	}
	return `HTTP ${status}`;
}
