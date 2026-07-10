import { describe, expect, it } from 'vitest';

import { parseDuckDuckGoHtml } from '../src/services/qa/search/duckduckgo';

describe('parseDuckDuckGoHtml', () => {
	it('extracts title, decoded url, and snippet for each result block', () => {
		const html = `
			<div class="result results_links">
				<h2 class="result__title">
					<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Ffoo&rut=abc">Example &amp; Foo</a>
				</h2>
				<a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Ffoo">
					This is a snippet describing the &quot;foo&quot; page.
				</a>
			</div>
			<div class="result">
				<h2>
					<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fbar">Bar site</a>
				</h2>
				<div class="result__snippet">Another snippet.</div>
			</div>
		`;

		const results = parseDuckDuckGoHtml(html);

		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			title: 'Example & Foo',
			url: 'https://example.com/foo',
			snippet: 'This is a snippet describing the "foo" page.',
		});
		expect(results[1]).toEqual({
			title: 'Bar site',
			url: 'https://example.org/bar',
			snippet: 'Another snippet.',
		});
	});

	it('skips blocks without a usable anchor', () => {
		const html = `
			<div class="result">
				<span>no anchor here</span>
			</div>
			<div class="result">
				<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com">Present</a>
				<div class="result__snippet">snippet</div>
			</div>
		`;

		const results = parseDuckDuckGoHtml(html);

		expect(results).toHaveLength(1);
		expect(results[0].url).toBe('https://example.com');
	});

	it('returns an empty array when the HTML has no result blocks', () => {
		expect(parseDuckDuckGoHtml('<html><body>Nothing.</body></html>')).toEqual([]);
	});
});
