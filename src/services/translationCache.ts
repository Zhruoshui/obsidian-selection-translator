import type { TextTranslationProviderId } from './languageCodes';

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 256;

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

export class TranslationCache {
	private readonly entries = new Map<string, CacheEntry>();

	get(parts: CacheKeyParts): CacheEntry | null {
		const key = buildKey(parts);
		const entry = this.entries.get(key);
		if (!entry) {
			return null;
		}
		if (Date.now() - entry.savedAt >= CACHE_TTL_MS) {
			this.entries.delete(key);
			return null;
		}
		return entry;
	}

	set(parts: CacheKeyParts, result: string): void {
		const key = buildKey(parts);
		if (this.entries.has(key)) {
			this.entries.delete(key);
		} else if (this.entries.size >= CACHE_MAX_ENTRIES) {
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
