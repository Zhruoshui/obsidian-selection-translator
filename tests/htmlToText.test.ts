import { describe, expect, it } from 'vitest';
import { htmlToText } from '../src/services/qa/htmlToText';

describe('htmlToText', () => {
	it('strips script, style, and nav-like elements', () => {
		const html = `
			<html>
				<head><style>body {}</style><script>alert(1)</script></head>
				<body>
					<nav>menu</nav>
					<header>header</header>
					<main>
						<h1>Title</h1>
						<p>Hello <b>world</b>.</p>
					</main>
					<footer>foot</footer>
				</body>
			</html>
		`;
		const text = htmlToText(html);
		expect(text).toContain('Title');
		expect(text).toContain('Hello world.');
		expect(text).not.toContain('alert');
		expect(text).not.toContain('menu');
		expect(text).not.toContain('header');
		expect(text).not.toContain('foot');
	});

	it('inserts paragraph breaks between block-level elements', () => {
		const html = '<p>One.</p><p>Two.</p><p>Three.</p>';
		const text = htmlToText(html);
		const lines = text.split('\n').filter((l) => l.length > 0);
		expect(lines).toEqual(['One.', 'Two.', 'Three.']);
	});

	it('decodes HTML entities', () => {
		expect(htmlToText('<p>Rock &amp; roll &quot;hi&quot;</p>')).toBe(
			'Rock & roll "hi"',
		);
	});

	it('turns <br> into newline', () => {
		expect(htmlToText('a<br>b<br/>c')).toBe('a\nb\nc');
	});

	it('collapses excessive whitespace', () => {
		expect(htmlToText('<p>   a    b  </p>\n\n\n<p>c</p>')).toBe('a b\n\nc');
	});

	it('returns an empty string for empty input', () => {
		expect(htmlToText('')).toBe('');
	});
});
