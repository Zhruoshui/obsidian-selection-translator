import { describe, expect, it } from 'vitest';
import { TranslationCache, type CacheConfig } from '../src/services/translationCache';
import type { CacheKeyParts } from '../src/services/translationCache';

const baseKey: CacheKeyParts = {
	text: 'hello',
	provider: 'openai',
	sourceLanguage: 'Auto',
	targetLanguage: 'Chinese (Simplified)',
};

function makeCache(initial: Partial<CacheConfig> = {}) {
	let config: CacheConfig = {
		enabled: true,
		ttlMs: 10 * 60 * 1000,
		maxEntries: 256,
		...initial,
	};
	const cache = new TranslationCache(() => config);
	const setConfig = (next: Partial<CacheConfig>) => {
		config = { ...config, ...next };
	};
	return { cache, setConfig, getConfig: () => config };
}

describe('TranslationCache', () => {
	it('returns null and is a no-op for set when enabled=false', () => {
		const { cache } = makeCache({ enabled: false });
		cache.set(baseKey, 'hi');
		expect(cache.get(baseKey)).toBeNull();
		expect(cache.size()).toBe(0);
	});

	it('toggles enabled at runtime via the config closure', () => {
		const { cache, setConfig } = makeCache();
		setConfig({ enabled: false });
		expect(cache.get(baseKey)).toBeNull();
		setConfig({ enabled: true });
		cache.set(baseKey, '你好');
		expect(cache.get(baseKey)?.result).toBe('你好');
	});

	it('ttlMs=0 means entries never expire', () => {
		const { cache } = makeCache({ ttlMs: 0 });
		cache.set(baseKey, 'hi');
		expect(cache.get(baseKey)?.result).toBe('hi');
	});

	it('entries expire when Date.now() - savedAt >= ttlMs', async () => {
		const { cache, setConfig } = makeCache();
		cache.set(baseKey, 'hi');
		setConfig({ ttlMs: 1 });
		await new Promise((resolve) => window.setTimeout(resolve, 10));
		expect(cache.get(baseKey)).toBeNull();
	});

	it('toggling ttlMs at runtime controls expiration', async () => {
		const { cache, setConfig } = makeCache({ ttlMs: 0 });
		cache.set(baseKey, 'hi');
		expect(cache.get(baseKey)?.result).toBe('hi');
		setConfig({ ttlMs: 1 });
		await new Promise((resolve) => window.setTimeout(resolve, 10));
		expect(cache.get(baseKey)).toBeNull();
	});

	it('drops the oldest entry when maxEntries is exceeded', () => {
		const { cache } = makeCache({ maxEntries: 2 });
		cache.set({ ...baseKey, text: 'a' }, 'A');
		cache.set({ ...baseKey, text: 'b' }, 'B');
		cache.set({ ...baseKey, text: 'c' }, 'C');
		expect(cache.size()).toBe(2);
		expect(cache.get({ ...baseKey, text: 'a' })).toBeNull();
		expect(cache.get({ ...baseKey, text: 'b' })?.result).toBe('B');
		expect(cache.get({ ...baseKey, text: 'c' })?.result).toBe('C');
	});

	it('invalidate() clears all entries', () => {
		const { cache } = makeCache();
		cache.set(baseKey, 'hi');
		cache.invalidate();
		expect(cache.size()).toBe(0);
		expect(cache.get(baseKey)).toBeNull();
	});
});
