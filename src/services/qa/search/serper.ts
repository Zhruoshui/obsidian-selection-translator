import { requestUrl } from 'obsidian';
import { t } from '../../../i18n';
import {
	requireApiKey,
	type SearchOptions,
	type SearchProvider,
	type SearchResult,
} from './index';

const SERPER_ENDPOINT = 'https://google.serper.dev/search';

/**
 * Serper.dev (Google results proxy). Docs: https://serper.dev/api-key
 *
 * Body: `{q, num}` — the `num` field ranges 1..100 in the API but we clamp to
 * a small value at the tool level. Response: `{organic: [{title, link, snippet}, ...]}`.
 */
export function createSerperProvider(apiKey: string): SearchProvider {
	return {
		id: 'serper',
		async search(
			query: string,
			opts: SearchOptions,
		): Promise<SearchResult[]> {
			const key = requireApiKey(apiKey, 'Serper');
			const response = await requestUrl({
				url: SERPER_ENDPOINT,
				method: 'POST',
				headers: {
					'X-API-KEY': key,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					q: query,
					num: opts.limit,
				}),
				throw: false,
			});
			if (opts.signal?.aborted) {
				throw new DOMException(t('qaLoopAborted'), 'AbortError');
			}
			if (response.status < 200 || response.status >= 300) {
				throw new Error(
					t('qaSearchProviderFailed', {
						provider: 'Serper',
						message: providerErrorMessage(response.json, response.text, response.status),
					}),
				);
			}
			return parseSerperResults(response.json);
		},
	};
}

function parseSerperResults(json: unknown): SearchResult[] {
	if (!isRecord(json)) {
		return [];
	}
	const results: unknown = json.organic;
	if (!Array.isArray(results)) {
		return [];
	}
	const out: SearchResult[] = [];
	for (const entry of results) {
		if (!isRecord(entry)) {
			continue;
		}
		const title = stringOrEmpty(entry.title);
		const url = stringOrEmpty(entry.link);
		if (!url) {
			continue;
		}
		const snippet = stringOrEmpty(entry.snippet);
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
		const detail: unknown = json.message ?? json.error;
		if (typeof detail === 'string' && detail.trim()) {
			return detail.trim();
		}
	}
	if (text && text.trim()) {
		return text.trim();
	}
	return `HTTP ${status}`;
}
