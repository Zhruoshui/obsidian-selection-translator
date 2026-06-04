import { Notice } from 'obsidian';
import { t } from '../i18n';
import type { TranslationTask } from '../translation/task';

type CloseHandler = () => void;

export interface TranslationPopoverOptions {
	showSelectedText: boolean;
}

export class TranslationPopover {
	private containerEl: HTMLDivElement | null = null;
	private currentTask: TranslationTask | null = null;
	private isUserPositioned = false;
	private isUserSized = false;
	private dragState: {
		offsetX: number;
		offsetY: number;
	} | null = null;
	private resizeState: {
		startWidth: number;
		startHeight: number;
		startX: number;
		startY: number;
	} | null = null;

	constructor(
		private readonly onRetry: (sourceText: string) => void,
		private readonly onClose: CloseHandler,
	) {}

	show(task: TranslationTask, options: TranslationPopoverOptions) {
		this.currentTask = task;
		this.ensureContainer();
		this.render(task, options);
		this.position();
	}

	showIdle() {
		this.currentTask = null;
		this.ensureContainer();
		this.renderIdle();
		this.position();
	}

	update(task: TranslationTask, options: TranslationPopoverOptions) {
		if (!this.containerEl || this.currentTask?.id !== task.id) {
			return;
		}
		this.render(task, options);
		this.position();
	}

	close() {
		const wasOpen = this.containerEl !== null;
		this.containerEl?.remove();
		this.containerEl = null;
		this.currentTask = null;
		this.dragState = null;
		this.resizeState = null;
		this.isUserPositioned = false;
		this.isUserSized = false;
		if (wasOpen) {
			this.onClose();
		}
	}

	isOpen() {
		return this.containerEl !== null;
	}

	private ensureContainer() {
		if (this.containerEl) {
			return;
		}

		const container = activeDocument.createElement('div');
		container.className = 'selection-translator-popover';
		container.setAttribute('role', 'dialog');
		container.setAttribute('aria-label', t('popoverAriaLabel'));
		container.addEventListener('pointermove', (event) => {
			this.handlePointerMove(event);
		});
		container.addEventListener('pointerup', (event) => {
			this.handlePointerUp(event);
		});
		container.addEventListener('pointercancel', (event) => {
			this.handlePointerUp(event);
		});
		activeDocument.body.appendChild(container);
		this.containerEl = container;
	}

	private render(task: TranslationTask, options: TranslationPopoverOptions) {
		if (!this.containerEl) {
			return;
		}

		const sourceText = getSourceInputValue(this.containerEl) ?? task.raw;

		this.containerEl.replaceChildren();
		this.containerEl.appendChild(this.createHeader());

		const contentEl = activeDocument.createElement('div');
		contentEl.className = 'selection-translator-popover__content';
		if (options.showSelectedText) {
			contentEl.appendChild(
				createEditableSection(t('popoverSelectedText'), sourceText),
			);
		}

		const resultText = getResultText(task);
		contentEl.appendChild(createSection(getResultLabel(task), resultText));
		this.containerEl.appendChild(contentEl);

		const actionsEl = activeDocument.createElement('div');
		actionsEl.className = 'selection-translator-popover__actions';

		const copyButton = createButton(t('popoverCopy'), 'mod-cta');
		copyButton.disabled = !task.result;
		copyButton.addEventListener('click', () => {
			void copyToClipboard(task.result);
		});
		actionsEl.appendChild(copyButton);

		const retryButton = createButton(t('popoverRetry'));
		retryButton.disabled = task.status === 'processing';
		retryButton.addEventListener('click', () => {
			this.onRetry(getSourceInputValue(this.containerEl) ?? task.raw);
		});
		actionsEl.appendChild(retryButton);

		this.containerEl.appendChild(actionsEl);
		this.containerEl.appendChild(this.createResizeHandle());
	}

	private renderIdle() {
		if (!this.containerEl) {
			return;
		}

		this.containerEl.replaceChildren();
		this.containerEl.appendChild(this.createHeader());
		const contentEl = activeDocument.createElement('div');
		contentEl.className = 'selection-translator-popover__content';
		contentEl.appendChild(
			createSection(t('popoverStatus'), t('popoverIdle')),
		);
		this.containerEl.appendChild(contentEl);
		this.containerEl.appendChild(this.createResizeHandle());
	}

	private createHeader() {
		const headerEl = activeDocument.createElement('div');
		headerEl.className = 'selection-translator-popover__header';
		headerEl.addEventListener('pointerdown', (event) => {
			this.handlePointerDown(event);
		});

		const titleEl = activeDocument.createElement('div');
		titleEl.className = 'selection-translator-popover__title';
		titleEl.textContent = t('popoverTitle');
		headerEl.appendChild(titleEl);

		const closeButton = createButton('x', 'selection-translator-icon-button');
		closeButton.setAttribute('aria-label', t('popoverCloseTranslation'));
		closeButton.setAttribute('title', t('popoverCloseTranslation'));
		closeButton.addEventListener('pointerdown', (event) => {
			event.stopPropagation();
		});
		closeButton.addEventListener('click', () => this.close());
		headerEl.appendChild(closeButton);

		return headerEl;
	}

	private createResizeHandle() {
		const handleEl = activeDocument.createElement('div');
		handleEl.className = 'selection-translator-popover__resize-handle';
		handleEl.setAttribute('role', 'separator');
		handleEl.setAttribute('aria-label', t('popoverResizeAriaLabel'));
		handleEl.setAttribute('title', t('popoverResizeTitle'));
		handleEl.addEventListener('pointerdown', (event) => {
			this.handleResizePointerDown(event);
		});
		return handleEl;
	}

	private position() {
		if (!this.containerEl) {
			return;
		}

		if (this.isUserPositioned) {
			this.keepInsideViewport();
			return;
		}

		this.containerEl.style.removeProperty('left');
		this.containerEl.style.removeProperty('top');
		this.containerEl.style.removeProperty('right');
		this.containerEl.style.removeProperty('bottom');
		this.containerEl.classList.remove('selection-translator-popover--fallback');

		const rect = getSelectionRect();
		if (!rect) {
			this.containerEl.classList.add('selection-translator-popover--fallback');
			return;
		}

		window.requestAnimationFrame(() => {
			if (!this.containerEl) {
				return;
			}

			const width = this.containerEl.offsetWidth;
			const height = this.containerEl.offsetHeight;
			const margin = 12;
			const left = clamp(
				rect.left,
				margin,
				activeWindow.innerWidth - width - margin,
			);
			let top = rect.bottom + 8;

			if (top + height + margin > activeWindow.innerHeight) {
				top = rect.top - height - 8;
			}

			this.containerEl.setCssProps({
				left: `${clamp(
					left,
					margin,
					activeWindow.innerWidth - width - margin,
				)}px`,
				top: `${clamp(
					top,
					margin,
					activeWindow.innerHeight - height - margin,
				)}px`,
			});
		});
	}

	private handlePointerDown(event: PointerEvent) {
		if (!this.containerEl || event.button !== 0) {
			return;
		}

		const rect = this.containerEl.getBoundingClientRect();
		this.dragState = {
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
		};
		this.isUserPositioned = true;
		this.containerEl.setPointerCapture(event.pointerId);
		this.containerEl.classList.add('selection-translator-popover--dragging');
		event.preventDefault();
	}

	private handleResizePointerDown(event: PointerEvent) {
		if (!this.containerEl || event.button !== 0) {
			return;
		}

		const rect = this.containerEl.getBoundingClientRect();
		this.resizeState = {
			startWidth: rect.width,
			startHeight: rect.height,
			startX: event.clientX,
			startY: event.clientY,
		};
		this.isUserSized = true;
		this.isUserPositioned = true;
		this.containerEl.setPointerCapture(event.pointerId);
		this.containerEl.classList.add('selection-translator-popover--sized');
		this.containerEl.classList.add('selection-translator-popover--resizing');
		event.stopPropagation();
		event.preventDefault();
	}

	private handlePointerMove(event: PointerEvent) {
		if (this.resizeState) {
			this.handleResizePointerMove(event);
			return;
		}

		if (!this.containerEl || !this.dragState) {
			return;
		}

		this.containerEl.classList.remove('selection-translator-popover--fallback');
		this.containerEl.style.removeProperty('right');
		this.containerEl.style.removeProperty('bottom');
		this.containerEl.setCssProps({
			left: `${clamp(
				event.clientX - this.dragState.offsetX,
				8,
				activeWindow.innerWidth - this.containerEl.offsetWidth - 8,
			)}px`,
			top: `${clamp(
				event.clientY - this.dragState.offsetY,
				8,
				activeWindow.innerHeight - this.containerEl.offsetHeight - 8,
			)}px`,
		});
	}

	private handleResizePointerMove(event: PointerEvent) {
		if (!this.containerEl || !this.resizeState) {
			return;
		}

		const rect = this.containerEl.getBoundingClientRect();
		const minWidth = getMinPopoverWidth();
		const minHeight = getMinPopoverHeight();
		const maxWidth = Math.max(minWidth, activeWindow.innerWidth - rect.left - 8);
		const maxHeight = Math.max(
			minHeight,
			activeWindow.innerHeight - rect.top - 8,
		);
		const width = clamp(
			this.resizeState.startWidth + event.clientX - this.resizeState.startX,
			minWidth,
			maxWidth,
		);
		const height = clamp(
			this.resizeState.startHeight + event.clientY - this.resizeState.startY,
			minHeight,
			maxHeight,
		);

		this.containerEl.setCssProps({
			width: `${width}px`,
			height: `${height}px`,
		});
	}

	private handlePointerUp(event: PointerEvent) {
		if (this.containerEl && this.resizeState) {
			this.resizeState = null;
			this.containerEl.releasePointerCapture(event.pointerId);
			this.containerEl.classList.remove('selection-translator-popover--resizing');
			this.keepInsideViewport();
			return;
		}

		if (!this.containerEl || !this.dragState) {
			return;
		}

		this.dragState = null;
		this.containerEl.releasePointerCapture(event.pointerId);
		this.containerEl.classList.remove('selection-translator-popover--dragging');
		this.keepInsideViewport();
	}

	private keepInsideViewport() {
		if (!this.containerEl) {
			return;
		}

		const rect = this.containerEl.getBoundingClientRect();
		if (this.isUserSized) {
			this.containerEl.setCssProps({
				width: `${clamp(
					rect.width,
					getMinPopoverWidth(),
					activeWindow.innerWidth - 16,
				)}px`,
				height: `${clamp(
					rect.height,
					getMinPopoverHeight(),
					activeWindow.innerHeight - 16,
				)}px`,
			});
		}

		this.containerEl.setCssProps({
			left: `${clamp(
				rect.left,
				8,
				activeWindow.innerWidth - this.containerEl.offsetWidth - 8,
			)}px`,
			top: `${clamp(
				rect.top,
				8,
				activeWindow.innerHeight - this.containerEl.offsetHeight - 8,
			)}px`,
		});
	}
}

function createSection(label: string, text: string) {
	const sectionEl = activeDocument.createElement('section');
	sectionEl.className = 'selection-translator-popover__section';

	const labelEl = activeDocument.createElement('div');
	labelEl.className = 'selection-translator-popover__label';
	labelEl.textContent = label;
	sectionEl.appendChild(labelEl);

	const bodyEl = activeDocument.createElement('div');
	bodyEl.className = 'selection-translator-popover__body';
	bodyEl.textContent = text;
	sectionEl.appendChild(bodyEl);

	return sectionEl;
}

function createEditableSection(label: string, text: string) {
	const sectionEl = activeDocument.createElement('section');
	sectionEl.className = 'selection-translator-popover__section';

	const labelEl = activeDocument.createElement('div');
	labelEl.className = 'selection-translator-popover__label';
	labelEl.textContent = label;
	sectionEl.appendChild(labelEl);

	const inputEl = activeDocument.createElement('textarea');
	inputEl.className = 'selection-translator-popover__source-input';
	inputEl.placeholder = t('popoverSelectedTextPlaceholder');
	inputEl.rows = 4;
	inputEl.value = text;
	sectionEl.appendChild(inputEl);

	return sectionEl;
}

function getSourceInputValue(containerEl: HTMLElement | null) {
	const inputEl = containerEl?.querySelector(
		'.selection-translator-popover__source-input',
	);
	if (!(inputEl instanceof HTMLTextAreaElement)) {
		return null;
	}
	return inputEl.value;
}

function createButton(label: string, extraClass?: string) {
	const button = activeDocument.createElement('button');
	button.type = 'button';
	button.className = extraClass ? `clickable-icon ${extraClass}` : 'mod-cta';
	button.textContent = label;
	return button;
}

function getResultLabel(task: TranslationTask) {
	switch (task.status) {
		case 'processing':
			return t('popoverStatus');
		case 'fail':
			return t('popoverError');
		case 'success':
			return t('popoverTranslation');
		case 'waiting':
			return t('popoverStatus');
	}
}

function getResultText(task: TranslationTask) {
	switch (task.status) {
		case 'processing':
			return task.result || t('popoverTranslating');
		case 'fail':
			return task.error || t('popoverTranslationFailed');
		case 'success':
			return task.result;
		case 'waiting':
			return t('popoverWaiting');
	}
}

function getSelectionRect() {
	const selection = activeWindow.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
		return null;
	}

	const rect = selection.getRangeAt(0).getBoundingClientRect();
	if (rect.width === 0 && rect.height === 0) {
		return null;
	}

	return rect;
}

function clamp(value: number, min: number, max: number) {
	if (max < min) {
		return min;
	}
	return Math.min(Math.max(value, min), max);
}

function getMinPopoverWidth() {
	return Math.max(160, Math.min(320, activeWindow.innerWidth - 16));
}

function getMinPopoverHeight() {
	return Math.max(160, Math.min(240, activeWindow.innerHeight - 16));
}

async function copyToClipboard(text: string) {
	if (!text) {
		return;
	}

	await navigator.clipboard.writeText(text);
	new Notice(t('popoverCopied'));
}
