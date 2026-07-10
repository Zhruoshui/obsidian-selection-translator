import { requestUrl } from 'obsidian';
import { t } from '../../../i18n';
import type { SearchOptions, SearchProvider, SearchResult } from './index';

const DUCKDUCKGO_HTML_ENDPOINT = 'https://html.duckduckgo.com/html/';
const USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
	'Chrome/122.0.0.0 Safari/537.36';

/**
 * Free, no-API-key DuckDuckGo backend. It hits the HTML endpoint used by their
 * lite website and scrapes result blocks. Fragile by nature (the DOM can shift)
 * so we keep the parser deliberately loose: we only look for the anchor href
 * pattern DuckDuckGo has used for years — `.result__a` — and its adjacent
 * snippet element. Anything unrecognized is dropped instead of crashing.
 */
export function createDuckDuckGoProvider(): SearchProvider {
	return {
		id: 'duckduckgo',
		async search(
			query: string,
			opts: SearchOptions,
		): Promise<SearchResult[]> {
			const params = new URLSearchParams({ q: query });
			const response = await requestUrl({
				url: DUCKDUCKGO_HTML_ENDPOINT,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent': USER_AGENT,
				},
				body: params.toString(),
				throw: false,
			});
			if (opts.signal?.aborted) {
				throw new DOMException(t('qaLoopAborted'), 'AbortError');
			}
			if (response.status < 200 || response.status >= 300) {
				throw new Error(
					t('qaSearchProviderFailed', {
						provider: 'DuckDuckGo',
						message: `HTTP ${response.status}`,
					}),
				);
			}
			return parseDuckDuckGoHtml(response.text).slice(0, opts.limit);
		},
	};
}

/**
 * Regex-based parser: safer in isolated / test environments than DOMParser and
 * DuckDuckGo's HTML is structurally simple enough that a well-scoped regex is
 * more reliable than a DOM walk (their pages ship malformed tags occasionally).
 */
export function parseDuckDuckGoHtml(html: string): SearchResult[] {
	// Locate every result block boundary by class marker, then treat the span
	// between successive markers as one block. This is more forgiving than
	// trying to match balanced </div>s (DuckDuckGo's markup is not consistent).
	const markerRe = /<div[^>]*class="[^"]*\bresult\b[^"]*"[^>]*>/gi;
	const boundaries: number[] = [];
	let m: RegExpExecArray | null;
	while ((m = markerRe.exec(html)) !== null) {
		boundaries.push(m.index);
	}
	if (boundaries.length === 0) {
		return [];
	}
	boundaries.push(html.length);
	const results: SearchResult[] = [];
	for (let i = 0; i < boundaries.length - 1; i += 1) {
		const block = html.slice(boundaries[i], boundaries[i + 1]);
		const anchor = /<a[^>]*class="[^"]*\bresult__a\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(
			block,
		);
		if (!anchor) {
			continue;
		}
		const url = decodeDuckDuckGoRedirect(unescapeHtml(anchor[1] ?? ''));
		if (!url) {
			continue;
		}
		const title = stripTags(anchor[2] ?? '');
		const snippetMatch =
			/<a[^>]*class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block) ??
			/<div[^>]*class="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
		const snippet = snippetMatch ? stripTags(snippetMatch[1] ?? '') : '';
		if (!title && !snippet) {
			continue;
		}
		results.push({ title, url, snippet });
	}
	return results;
}

/**
 * DuckDuckGo wraps every result URL in a redirect like
 *   `//duckduckgo.com/l/?uddg=<encoded-target>&rut=...`.
 * We unwrap it back to the original URL.
 */
function decodeDuckDuckGoRedirect(href: string): string {
	let normalized = href;
	if (normalized.startsWith('//')) {
		normalized = `https:${normalized}`;
	}
	try {
		const url = new URL(normalized);
		const target = url.searchParams.get('uddg');
		if (target) {
			return decodeURIComponent(target);
		}
		return url.toString();
	} catch {
		return normalized;
	}
}

function stripTags(html: string): string {
	return unescapeHtml(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function unescapeHtml(html: string): string {
	return html
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
		.replace(/&nbsp;/g, ' ');
}
