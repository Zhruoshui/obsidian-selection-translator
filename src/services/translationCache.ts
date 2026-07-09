import type { TextTranslationProviderId } from './languageCodes';

export interface CacheEntry {
	result: string;
	savedAt: number;
}

export interface CacheKeyParts {
	text: string;
	provider: TextTranslationProviderId;
	sourceLanguage: string;
	targetLanguage: string;
}

export interface CacheConfig {
	enabled: boolean;
	ttlMs: number;
	maxEntries: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
	enabled: true,
	ttlMs: 10 * 60 * 1000,
	maxEntries: 256,
};

export class TranslationCache {
	private readonly entries = new Map<string, CacheEntry>();

	constructor(
		private readonly getConfig: () => CacheConfig = () => DEFAULT_CACHE_CONFIG,
	) {}

	get(parts: CacheKeyParts): CacheEntry | null {
		const config = this.getConfig();
		if (!config.enabled) {
			return null;
		}
		const key = buildKey(parts);
		const entry = this.entries.get(key);
		if (!entry) {
			return null;
		}
		if (config.ttlMs > 0 && Date.now() - entry.savedAt >= config.ttlMs) {
			this.entries.delete(key);
			return null;
		}
		return entry;
	}

	set(parts: CacheKeyParts, result: string): void {
		const config = this.getConfig();
		if (!config.enabled) {
			return;
		}
		const key = buildKey(parts);
		if (this.entries.has(key)) {
			this.entries.delete(key);
		} else if (this.entries.size >= config.maxEntries) {
			const oldest = this.entries.keys().next();
			if (!oldest.done) {
				this.entries.delete(oldest.value);
			}
		}
		this.entries.set(key, { result, savedAt: Date.now() });
	}

	invalidate(): void {
		this.entries.clear();
	}

	size(): number {
		return this.entries.size;
	}
}

function buildKey(parts: CacheKeyParts): string {
	return `${parts.provider}|${parts.sourceLanguage}|${parts.targetLanguage}|${parts.text}`;
}
