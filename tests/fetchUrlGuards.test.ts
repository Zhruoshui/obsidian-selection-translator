import { describe, expect, it } from 'vitest';
import { isPrivateHost, validateFetchUrl } from '../src/services/qa/tools/fetchUrl';

describe('isPrivateHost', () => {
	const blocked = [
		'localhost',
		'foo.localhost',
		'server.local',
		'thing.internal',
		'127.0.0.1',
		'127.5.5.5',
		'10.0.0.1',
		'10.255.255.255',
		'192.168.1.1',
		'169.254.1.1',
		'172.16.0.1',
		'172.19.255.255',
		'172.31.0.1',
		'0.0.0.0',
	];
	for (const host of blocked) {
		it(`blocks ${host}`, () => {
			expect(isPrivateHost(host)).toBe(true);
		});
	}

	const allowed = [
		'example.com',
		'www.google.com',
		'8.8.8.8',
		'172.15.0.1',
		'172.32.0.1',
		'11.0.0.1',
	];
	for (const host of allowed) {
		it(`allows ${host}`, () => {
			expect(isPrivateHost(host)).toBe(false);
		});
	}
});

describe('validateFetchUrl', () => {
	it('accepts http and https URLs on public hosts', () => {
		expect(validateFetchUrl('https://example.com/foo').ok).toBe(true);
		expect(validateFetchUrl('http://example.com/').ok).toBe(true);
	});

	it('rejects invalid URLs', () => {
		const result = validateFetchUrl('not a url');
		expect(result.ok).toBe(false);
	});

	it('rejects non-http protocols', () => {
		expect(validateFetchUrl('file:///etc/passwd').ok).toBe(false);
		expect(validateFetchUrl('ftp://example.com').ok).toBe(false);
		expect(validateFetchUrl('javascript:alert(1)').ok).toBe(false);
	});

	it('rejects private / local hosts', () => {
		expect(validateFetchUrl('http://localhost/foo').ok).toBe(false);
		expect(validateFetchUrl('http://127.0.0.1:8080').ok).toBe(false);
		expect(validateFetchUrl('http://192.168.1.1').ok).toBe(false);
		expect(validateFetchUrl('http://server.local').ok).toBe(false);
	});
});
