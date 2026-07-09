import type { TextTranslationProviderId } from './languageCodes';

export const DEFAULT_THROTTLE_MS = 1500;

/**
 * Throttle key. Translation providers use {@link TextTranslationProviderId};
 * the AI Q&A path uses the literal `'ai-qa'`. A plain `string` keeps the
 * throttle generic without forcing every caller into the provider union.
 */
export type RequestThrottleKey = TextTranslationProviderId | 'ai-qa';

export class RequestThrottle {
	private readonly lastSentAt = new Map<string, number>();

	async wait(
		provider: RequestThrottleKey,
		signal?: AbortSignal,
		minIntervalMs: number = DEFAULT_THROTTLE_MS,
	): Promise<void> {
		if (signal?.aborted) {
			throw createAbortError();
		}

		const interval = Math.max(0, minIntervalMs);
		const now = Date.now();
		const last = this.lastSentAt.get(provider) ?? 0;
		const elapsed = now - last;
		if (elapsed >= interval) {
			this.lastSentAt.set(provider, now);
			return;
		}

		const delay = interval - elapsed;
		await waitWithAbort(delay, signal);
		if (signal?.aborted) {
			throw createAbortError();
		}
		this.lastSentAt.set(provider, Date.now());
	}

	reset(provider?: RequestThrottleKey): void {
		if (provider === undefined) {
			this.lastSentAt.clear();
			return;
		}
		this.lastSentAt.delete(provider);
	}
}

function waitWithAbort(delay: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve();
		}, delay);
		const onAbort = () => {
			window.clearTimeout(timer);
			reject(createAbortError());
		};
		if (signal) {
			if (signal.aborted) {
				window.clearTimeout(timer);
				reject(createAbortError());
				return;
			}
			signal.addEventListener('abort', onAbort, { once: true });
		}
	});
}

function createAbortError(): Error {
	const error = new Error('Aborted');
	error.name = 'AbortError';
	return error;
}
