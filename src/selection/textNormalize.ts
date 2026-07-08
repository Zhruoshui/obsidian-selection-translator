const FENCE_OPEN_RE = /^(\s{0,3})(```+|~~~+)/;

export function normalizeSelectionText(input: string): string {
	if (!input) {
		return input;
	}

	const lines = input.split(/\r?\n/);
	const out: string[] = [];
	const paragraph: string[] = [];
	let fenceIndent = '';
	let fenceMarker = '';
	let inFence = false;

	const flushParagraph = () => {
		if (paragraph.length === 0) {
			return;
		}
		const joined = paragraph
			.map((line) => line.replace(/[ \t\u00A0]+/g, ' ').trim())
			.filter((line) => line.length > 0)
			.join(' ');
		if (joined.length > 0) {
			out.push(joined);
		}
		paragraph.length = 0;
	};

	for (const line of lines) {
		if (inFence) {
			out.push(line);
			const closeRe = new RegExp(
				`^${escapeForRegex(fenceIndent)}${escapeForRegex(fenceMarker)}\\s*$`,
			);
			if (closeRe.test(line)) {
				inFence = false;
				fenceIndent = '';
				fenceMarker = '';
			}
			continue;
		}

		const openMatch = line.match(FENCE_OPEN_RE);
		if (openMatch) {
			const indent = openMatch[1] ?? '';
			const marker = openMatch[2] ?? '';
			const rest = line.slice(indent.length + marker.length);
			if (!/^\s*`/.test(rest) && !/^\s*~/.test(rest)) {
				flushParagraph();
				out.push(line);
				inFence = true;
				fenceIndent = indent;
				fenceMarker = marker;
				continue;
			}
		}

		if (line.trim() === '') {
			flushParagraph();
			out.push('');
		} else {
			paragraph.push(line);
		}
	}

	flushParagraph();
	while (out.length > 0 && out[out.length - 1] === '') {
		out.pop();
	}
	while (out.length > 0 && out[0] === '') {
		out.shift();
	}
	return out
		.join('\n')
		.replace(/(?:\r?\n){3,}/g, '\n\n');
}

export function collapseWhitespaceOnResult(input: string): string {
	if (!input) {
		return input;
	}

	const lines = input.split(/\r?\n/);
	const out: string[] = [];
	let fenceIndent = '';
	let fenceMarker = '';
	let inFence = false;

	for (const line of lines) {
		if (inFence) {
			out.push(line);
			const closeRe = new RegExp(
				`^${escapeForRegex(fenceIndent)}${escapeForRegex(fenceMarker)}\\s*$`,
			);
			if (closeRe.test(line)) {
				inFence = false;
				fenceIndent = '';
				fenceMarker = '';
			}
			continue;
		}

		const openMatch = line.match(FENCE_OPEN_RE);
		if (openMatch) {
			const indent = openMatch[1] ?? '';
			const marker = openMatch[2] ?? '';
			const rest = line.slice(indent.length + marker.length);
			if (!/^\s*`/.test(rest) && !/^\s*~/.test(rest)) {
				inFence = true;
				fenceIndent = indent;
				fenceMarker = marker;
				out.push(line);
				continue;
			}
		}

		out.push(line.replace(/[ \t\u00A0]+/g, ' '));
	}

	return out
		.join('\n')
		.replace(/(?:\r?\n){3,}/g, '\n\n');
}

function escapeForRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
