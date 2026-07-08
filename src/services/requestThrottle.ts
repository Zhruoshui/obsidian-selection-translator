import type { TextTranslationProviderId } from './languageCodes';

const MIN_INTERVAL_MS = 1500;

export class RequestThrottle {
	private readonly lastSentAt = new Map<TextTranslationProviderId, number>();

	async wait(
		provider: TextTranslationProviderId,
		signal?: AbortSignal,
	): Promise<void> {
		if (signal?.aborted) {
			throw createAbortError();
		}

		const now = Date.now();
		const last = this.lastSentAt.get(provider) ?? 0;
		const elapsed = now - last;
		if (elapsed >= MIN_INTERVAL_MS) {
			this.lastSentAt.set(provider, now);
			return;
		}

		const delay = MIN_INTERVAL_MS - elapsed;
		await waitWithAbort(delay, signal);
		if (signal?.aborted) {
			throw createAbortError();
		}
		this.lastSentAt.set(provider, Date.now());
	}

	reset(provider?: TextTranslationProviderId): void {
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
