import { describe, expect, it } from 'vitest';
import { RequestThrottle } from '../src/services/requestThrottle';

describe('RequestThrottle', () => {
	it('resolves immediately when minIntervalMs=0', async () => {
		const throttle = new RequestThrottle();
		const start = Date.now();
		await throttle.wait('openai', undefined, 0);
		await throttle.wait('openai', undefined, 0);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(20);
	});

	it('waits approximately minIntervalMs when calls are rapid', async () => {
		const throttle = new RequestThrottle();
		await throttle.wait('openai', undefined, 0);
		const start = Date.now();
		await throttle.wait('openai', undefined, 80);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(60);
		expect(elapsed).toBeLessThan(200);
	});

	it('throws AbortError when signal is aborted during wait', async () => {
		const throttle = new RequestThrottle();
		await throttle.wait('openai', undefined, 0);
		const controller = new AbortController();
		const pending = throttle.wait('openai', controller.signal, 200);
		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('does not advance lastSentAt when aborted during wait', async () => {
		const throttle = new RequestThrottle();
		await throttle.wait('openai', undefined, 0);
		const controller = new AbortController();
		const pending = throttle.wait('openai', controller.signal, 200);
		controller.abort();
		await pending.catch(() => undefined);
		const start = Date.now();
		await throttle.wait('openai', undefined, 0);
		expect(Date.now() - start).toBeLessThan(20);
	});
});
