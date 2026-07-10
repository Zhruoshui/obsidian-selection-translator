/**
 * Convert HTML to plain text good enough for feeding back to an LLM.
 *
 * This is not a full HTML → Markdown converter: we drop script / style /
 * navigation-ish tags, then walk the remainder replacing block-level closes
 * with newlines, stripping the rest of the tags, and folding whitespace.
 *
 * The implementation is intentionally regex based so it works in a sandboxed
 * Vitest / Node environment without depending on the Obsidian DOM.
 */
export function htmlToText(html: string): string {
	if (!html) {
		return '';
	}

	let text = html;

	// Drop entire noise elements including their content.
	const NOISE_TAGS = [
		'script',
		'style',
		'noscript',
		'template',
		'iframe',
		'svg',
		'nav',
		'header',
		'footer',
		'aside',
		'form',
	];
	for (const tag of NOISE_TAGS) {
		const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
		text = text.replace(re, '');
	}

	// Normalize <br> to newline before we start stripping tags.
	text = text.replace(/<br\s*\/?\s*>/gi, '\n');

	// Turn block-level closes into paragraph breaks so we don't merge them.
	const BLOCK_TAGS = [
		'p',
		'div',
		'section',
		'article',
		'li',
		'ul',
		'ol',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'blockquote',
		'pre',
		'tr',
		'td',
		'th',
		'table',
	];
	for (const tag of BLOCK_TAGS) {
		text = text.replace(new RegExp(`</${tag}\\s*>`, 'gi'), '\n');
	}

	// Strip all remaining tags.
	text = text.replace(/<[^>]+>/g, '');

	// HTML entity decode.
	text = decodeEntities(text);

	// Collapse whitespace: keep newlines meaningful, cap them at 2 consecutive.
	text = text
		.split('\n')
		.map((line) => line.replace(/[ \t\r\f\v]+/g, ' ').trim())
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return text;
}

function decodeEntities(input: string): string {
	return input
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
			String.fromCodePoint(parseInt(hex, 16)),
		)
		.replace(/&#(\d+);/g, (_, dec: string) =>
			String.fromCodePoint(parseInt(dec, 10)),
		);
}
