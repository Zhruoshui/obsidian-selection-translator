import { describe, expect, it } from 'vitest';
import {
	collapseWhitespaceOnResult,
	normalizeSelectionText,
} from '../src/selection/textNormalize';

describe('normalizeSelectionText', () => {
	it('AC-1: preserves paragraph breaks (blank lines) and folds in-paragraph newlines into a single space', () => {
		const input = 'First line\nsecond line\n\nThird paragraph';
		const output = normalizeSelectionText(input);
		expect(output).toBe('First line second line\n\nThird paragraph');
	});

	it('AC-2: collapses runs of internal whitespace into a single space', () => {
		const input = 'word1   word2\t\tword3';
		const output = normalizeSelectionText(input);
		expect(output).toBe('word1 word2 word3');
	});

	it('AC-2b: trims leading and trailing blank lines', () => {
		const input = '\n\nhello world\n\n';
		const output = normalizeSelectionText(input);
		expect(output).toBe('hello world');
	});

	it('AC-3: keeps Markdown code fences intact across lines', () => {
		const input = '```ts\nconst x = 1;\nconst y = 2;\n```';
		const output = normalizeSelectionText(input);
		expect(output).toBe('```ts\nconst x = 1;\nconst y = 2;\n```');
	});

	it('AC-3b: keeps indented code fence content intact', () => {
		const input = '   ```\n  inside fence\n   ```';
		const output = normalizeSelectionText(input);
		expect(output).toBe('   ```\n  inside fence\n   ```');
	});

	it('AC-3c: closes fence when only the fence marker line ends with no extra backticks/tildes', () => {
		const input = '```\nrow1\nrow2\n```\n\nafter';
		const output = normalizeSelectionText(input);
		expect(output).toBe('```\nrow1\nrow2\n```\n\nafter');
	});

	it('AC-4: folds PDF column-wrapped newlines into a single paragraph', () => {
		const input = 'This is a long\nsentence that wraps\nover several lines.';
		const output = normalizeSelectionText(input);
		expect(output).toBe('This is a long sentence that wraps over several lines.');
	});

	it('AC-4b: still preserves explicit paragraph breaks after wrapping', () => {
		const input = 'first paragraph\nline two\n\nsecond paragraph\nline two';
		const output = normalizeSelectionText(input);
		expect(output).toBe(
			'first paragraph line two\n\nsecond paragraph line two',
		);
	});
});

describe('collapseWhitespaceOnResult', () => {
	it('preserves code fences while collapsing excess whitespace on other lines', () => {
		const input = '```ts\nconst a = 1;\nconst b = 2;\n```\n\nresult  with   spaces';
		const output = collapseWhitespaceOnResult(input);
		expect(output).toBe('```ts\nconst a = 1;\nconst b = 2;\n```\n\nresult with spaces');
	});
});
