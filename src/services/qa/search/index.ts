import { t } from '../../../i18n';
import { createDuckDuckGoProvider } from './duckduckgo';
import { createSerperProvider } from './serper';
import { createTavilyProvider } from './tavily';

export interface SearchResult {
	title: string;
	url: string;
	snippet: string;
}

export type SearchProviderId = 'tavily' | 'serper' | 'duckduckgo';

export interface SearchProviderSettings {
	provider: SearchProviderId;
	apiKey: string;
}

export interface SearchOptions {
	limit: number;
	signal?: AbortSignal;
}

export interface SearchProvider {
	readonly id: SearchProviderId;
	search(query: string, opts: SearchOptions): Promise<SearchResult[]>;
}

export const DEFAULT_SEARCH_PROVIDER: SearchProviderId = 'duckduckgo';

export function isSearchProviderId(value: unknown): value is SearchProviderId {
	return value === 'tavily' || value === 'serper' || value === 'duckduckgo';
}

export function resolveSearchProvider(value: unknown): SearchProviderId {
	return isSearchProviderId(value) ? value : DEFAULT_SEARCH_PROVIDER;
}

/**
 * Build the concrete provider selected by the user. Provider modules are tiny
 * (one function each) so eager imports are fine.
 */
export function createSearchProvider(
	settings: SearchProviderSettings,
): SearchProvider {
	switch (settings.provider) {
		case 'tavily':
			return createTavilyProvider(settings.apiKey);
		case 'serper':
			return createSerperProvider(settings.apiKey);
		case 'duckduckgo':
			return createDuckDuckGoProvider();
	}
}

/** Throws with an i18n error when the API key is empty. */
export function requireApiKey(apiKey: string, providerLabel: string): string {
	const trimmed = apiKey.trim();
	if (!trimmed) {
		throw new Error(t('qaSearchMissingApiKey', { provider: providerLabel }));
	}
	return trimmed;
}
