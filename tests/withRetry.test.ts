import { describe, expect, it } from 'vitest';
import { DEFAULT_RETRY_CONFIG, withRetry } from '../src/services/translationService';

const baseConfig = { ...DEFAULT_RETRY_CONFIG };

function statusError(status: number) {
	return new Error('boom', {
		cause: { status },
	}) as Error & { cause?: { status: number } };
}

describe('withRetry', () => {
	it('does not retry when enabled=false (single attempt)', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(503);
		};
		await expect(
			withRetry(invoke, undefined, { ...baseConfig, enabled: false, maxAttempts: 3 }),
		).rejects.toBeInstanceOf(Error);
		expect(calls).toBe(1);
	});

	it('does not retry when maxAttempts=0', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(429);
		};
		await expect(
			withRetry(invoke, undefined, { ...baseConfig, maxAttempts: 0 }),
		).rejects.toBeInstanceOf(Error);
		expect(calls).toBe(1);
	});

	it('retries up to maxAttempts then throws', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(500);
		};
		await expect(
			withRetry(invoke, undefined, {
				...baseConfig,
				maxAttempts: 2,
				baseDelayMs: 1,
				maxDelayMs: 5,
			}),
		).rejects.toBeInstanceOf(Error);
		expect(calls).toBe(2);
	});

	it('clamps backoff when baseDelay > maxDelay', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(500);
		};
		const start = Date.now();
		await expect(
			withRetry(invoke, undefined, {
				...baseConfig,
				maxAttempts: 2,
				baseDelayMs: 9999,
				maxDelayMs: 5,
				jitterRatio: 0,
			}),
		).rejects.toBeInstanceOf(Error);
		const elapsed = Date.now() - start;
		expect(calls).toBe(2);
		expect(elapsed).toBeLessThan(500);
	});

	it('jitter stays within ±20% of the base exponential delay', async () => {
		const delays: number[] = [];
		const realSetTimeout = window.setTimeout;
		const captured = (fn: () => void, ms: number) => {
			delays.push(ms);
			return realSetTimeout(fn, 0);
		};
		(window as unknown as { setTimeout: typeof setTimeout }).setTimeout =
			captured as unknown as typeof setTimeout;

		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(500);
		};
		try {
			await expect(
				withRetry(invoke, undefined, {
					...baseConfig,
					maxAttempts: 2,
					baseDelayMs: 100,
					maxDelayMs: 1000,
					jitterRatio: 0.2,
				}),
			).rejects.toBeInstanceOf(Error);
		} finally {
			(window as unknown as { setTimeout: typeof setTimeout }).setTimeout =
				realSetTimeout;
		}

		expect(calls).toBe(2);
		expect(delays.length).toBeGreaterThanOrEqual(1);
		const base = 100;
		for (const d of delays) {
			expect(d).toBeGreaterThanOrEqual(base * 0.8 - 1);
			expect(d).toBeLessThanOrEqual(base * 1.2 + 1);
		}
	});

	it('throws AbortError without retrying when signal is aborted before invoke', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(500);
		};
		const controller = new AbortController();
		controller.abort();
		await expect(
			withRetry(invoke, controller.signal, {
				...baseConfig,
				maxAttempts: 3,
				baseDelayMs: 1,
				maxDelayMs: 5,
			}),
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(calls).toBe(0);
	});

	it('throws AbortError instead of retrying when signal aborts during backoff', async () => {
		let calls = 0;
		const invoke = async () => {
			calls += 1;
			throw statusError(500);
		};
		const controller = new AbortController();
		const pending = withRetry(invoke, controller.signal, {
			...baseConfig,
			maxAttempts: 5,
			baseDelayMs: 5,
			maxDelayMs: 50,
		});
		await new Promise((resolve) => window.setTimeout(resolve, 1));
		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
		expect(calls).toBeLessThanOrEqual(2);
	});
});
