import { requestUrl } from 'obsidian';
import { t } from '../../../i18n';
import { htmlToText } from '../htmlToText';
import {
	toolErrorMessage,
	type QaTool,
	type QaToolContext,
} from './index';

export const fetchUrlTool: QaTool = {
	name: 'fetch_url',
	description:
		'Fetch a web page and return its main text. Use this AFTER web_search to read ' +
		'the details of a specific result. Only http(s) URLs are allowed; private / local ' +
		'addresses are refused.',
	parameters: {
		type: 'object',
		properties: {
			url: {
				type: 'string',
				description: 'Absolute http(s) URL to fetch.',
			},
		},
		required: ['url'],
		additionalProperties: false,
	},
	async execute(args, ctx: QaToolContext): Promise<string> {
		const rawUrl = extractUrl(args);
		if (!rawUrl) {
			return toolErrorMessage(t('qaFetchInvalidUrl', { url: '' }));
		}
		const guardResult = validateFetchUrl(rawUrl);
		if (guardResult.ok === false) {
			return toolErrorMessage(guardResult.message);
		}
		ctx.onActivity('fetch', guardResult.url);
		try {
			const response = await requestUrl({
				url: guardResult.url,
				method: 'GET',
				throw: false,
			});
			if (ctx.signal.aborted) {
				throw new DOMException(t('qaLoopAborted'), 'AbortError');
			}
			if (response.status < 200 || response.status >= 300) {
				return toolErrorMessage(
					t('qaFetchFailed', { message: `HTTP ${response.status}` }),
				);
			}
			const body = response.text;
			if (!body) {
				return toolErrorMessage(t('qaFetchEmptyBody'));
			}
			const text = htmlToText(body);
			if (!text) {
				return toolErrorMessage(t('qaFetchEmptyBody'));
			}
			return truncate(text, ctx.settings.fetchMaxChars);
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}
			return toolErrorMessage(
				t('qaFetchFailed', { message: getErrorMessage(error) }),
			);
		}
	},
};

interface UrlGuardOk {
	ok: true;
	url: string;
}
interface UrlGuardErr {
	ok: false;
	message: string;
}
type UrlGuardResult = UrlGuardOk | UrlGuardErr;

/**
 * Reject obviously-unsafe URLs before we hand them to `requestUrl`. This is a
 * best-effort literal-string blocklist, not a full SSRF defence — Obsidian has
 * no DNS resolution API from the plugin sandbox. See design.md §Security.
 */
export function validateFetchUrl(input: string): UrlGuardResult {
	let parsed: URL;
	try {
		parsed = new URL(input);
	} catch {
		return { ok: false, message: t('qaFetchInvalidUrl', { url: input }) };
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return {
			ok: false,
			message: t('qaFetchUnsupportedProtocol', { url: input }),
		};
	}
	const host = parsed.hostname.toLowerCase();
	if (isPrivateHost(host)) {
		return { ok: false, message: t('qaFetchBlockedHost', { url: input }) };
	}
	return { ok: true, url: parsed.toString() };
}

export function isPrivateHost(host: string): boolean {
	if (!host) {
		return true;
	}
	if (host === 'localhost' || host.endsWith('.localhost')) {
		return true;
	}
	if (host.endsWith('.local') || host.endsWith('.internal')) {
		return true;
	}
	// IPv4 literal blocklist.
	if (/^0\./.test(host)) {
		return true;
	}
	if (/^127\./.test(host)) {
		return true;
	}
	if (/^10\./.test(host)) {
		return true;
	}
	if (/^192\.168\./.test(host)) {
		return true;
	}
	if (/^169\.254\./.test(host)) {
		return true;
	}
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
		return true;
	}
	// IPv6 loopback / link-local.
	if (host === '::1' || host === '[::1]') {
		return true;
	}
	if (host.startsWith('[fe80') || host.startsWith('[fc') || host.startsWith('[fd')) {
		return true;
	}
	return false;
}

function extractUrl(args: unknown): string {
	if (typeof args !== 'object' || args === null) {
		return '';
	}
	const value = (args as Record<string, unknown>).url;
	return typeof value === 'string' ? value.trim() : '';
}

function truncate(text: string, maxChars: number): string {
	if (maxChars <= 0 || text.length <= maxChars) {
		return text;
	}
	return text.slice(0, maxChars) + t('qaFetchTruncated', { chars: maxChars });
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'AbortError';
}
