import { describe, expect, it } from 'vitest';
import { isRetryableError } from '../src/services/translationService';

function makeError(message: string, status?: number) {
	if (status === undefined) {
		return new Error(message);
	}
	const error = new Error(message, {
		cause: { status },
	}) as Error & { cause?: { status: number } };
	return error;
}

function makeAbortError() {
	const error = new Error('Aborted');
	error.name = 'AbortError';
	return error;
}

describe('isRetryableError', () => {
	it('uses cause.status to retry 429', () => {
		const err = makeError('something', 429);
		expect(isRetryableError(err)).toBe(true);
	});

	it('uses cause.status to retry 5xx', () => {
		expect(isRetryableError(makeError('boom', 500))).toBe(true);
		expect(isRetryableError(makeError('boom', 503))).toBe(true);
	});

	it('does not retry 4xx other than 429', () => {
		expect(isRetryableError(makeError('unauthorized', 401))).toBe(false);
		expect(isRetryableError(makeError('bad request', 400))).toBe(false);
		expect(isRetryableError(makeError('forbidden', 403))).toBe(false);
	});

	it('does not retry 3xx', () => {
		expect(isRetryableError(makeError('redirect', 301))).toBe(false);
	});

	it('falls back to RETRY_KEYWORDS when no cause.status', () => {
		expect(isRetryableError(new Error('Invalid Access Limit'))).toBe(true);
		expect(isRetryableError(new Error('rate limit hit'))).toBe(true);
	});

	it('falls back to numeric code regex when no cause.status', () => {
		expect(isRetryableError(new Error('Failed: code 503'))).toBe(true);
		expect(isRetryableError(new Error('status 500 returned'))).toBe(true);
		expect(isRetryableError(new Error('http 429 too many'))).toBe(true);
	});

	it('returns false when neither cause, keyword, nor numeric code matches', () => {
		expect(isRetryableError(new Error('something else'))).toBe(false);
	});

	it('returns false for AbortError even with cause.status', () => {
		const err = makeAbortError();
		(err as Error & { cause?: { status: number } }).cause = { status: 429 };
		expect(isRetryableError(err)).toBe(false);
	});
});
