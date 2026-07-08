import { App, Editor, FileView } from 'obsidian';
import { normalizeSelectionText as collapseWhitespace } from './textNormalize';

export type SelectionSource = 'editor' | 'pdf';

export interface CurrentSelection {
	text: string;
	source: SelectionSource;
}

const POPOVER_SELECTOR = '.selection-translator-popover';

export function getEditorSelection(editor: Editor): CurrentSelection | null {
	const text = normalizeSelectionText(editor.getSelection());
	if (!text) {
		return null;
	}

	return {
		text,
		source: 'editor',
	};
}

export function getCurrentSelection(app: App): CurrentSelection | null {
	const editor = app.workspace.activeEditor?.editor;
	if (editor) {
		const editorSelection = getEditorSelection(editor);
		if (editorSelection) {
			return editorSelection;
		}
	}

	return getPdfDomSelection(app);
}

function getPdfDomSelection(app: App): CurrentSelection | null {
	const selection = activeWindow.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
		return null;
	}

	const text = normalizeSelectionText(selection.toString());
	if (!text) {
		return null;
	}

	const activeView = app.workspace.getActiveViewOfType(FileView);
	if (activeView?.file?.extension.toLowerCase() !== 'pdf') {
		return null;
	}

	if (isSelectionInsidePopover(selection)) {
		return null;
	}

	if (!isSelectionInsideElement(selection, activeView.containerEl)) {
		return null;
	}

	return {
		text,
		source: 'pdf',
	};
}

function isSelectionInsidePopover(selection: Selection) {
	const popoverEl = activeDocument.querySelector(POPOVER_SELECTOR);
	if (!(popoverEl instanceof HTMLElement)) {
		return false;
	}

	return isSelectionInsideElement(selection, popoverEl);
}

function isSelectionInsideElement(selection: Selection, element: HTMLElement) {
	return (
		isNodeInsideElement(selection.anchorNode, element) &&
		isNodeInsideElement(selection.focusNode, element)
	);
}

function isNodeInsideElement(node: Node | null, element: HTMLElement) {
	return node !== null && element.contains(node);
}

function normalizeSelectionText(text: string) {
	return collapseWhitespace(text);
}
