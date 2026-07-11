import { App, Component, MarkdownRenderer, Notice, setIcon } from 'obsidian';
import { t } from '../i18n';
import type { QaTurn } from '../services/qaAgent';
import type {
	PronunciationAudio,
	TranslationTask,
} from '../translation/task';

type CloseHandler = () => void;
type AskHandler = (question: string) => void;
type ClearQaHandler = () => void;

interface QaToolActivityEntry {
	kind: 'search' | 'fetch';
	detail: string;
}

export interface TranslationPopoverOptions {
	showSelectedText: boolean;
	qaEnabled: boolean;
	qaConfigReady: boolean;
}

const TEXT_AREA_SELECTOR =
	'.selection-translator-popover__source-input, .selection-translator-popover__result-output';
const AUTO_POPOVER_MAX_WIDTH = 760;
const AUTO_POPOVER_VIEWPORT_MARGIN = 16;
const COMPACT_POPOVER_WIDTH = 340;
const MEDIUM_RESULT_POPOVER_WIDTH = 420;
const LONG_RESULT_POPOVER_WIDTH = 520;
const SPLIT_POPOVER_WIDTH = 640;
const LONG_SPLIT_POPOVER_WIDTH = 720;
const SPLIT_LAYOUT_MIN_WIDTH = 520;
const MEDIUM_TEXT_LENGTH = 120;
const LONG_TEXT_LENGTH = 280;
const TEXT_AREA_MIN_HEIGHT = 64;
const TEXT_AREA_MAX_HEIGHT = 320;
const SINGLE_TEXT_AREA_RESERVED_HEIGHT = 128;
const MULTI_TEXT_AREA_RESERVED_HEIGHT = 172;

export class TranslationPopover {
	private containerEl: HTMLDivElement | null = null;
	private currentTask: TranslationTask | null = null;
	private currentOptions: TranslationPopoverOptions | null = null;
	private isUserPositioned = false;
	private isUserSized = false;
	private qaExpanded = false;
	private qaHistory: QaTurn[] = [];
	private qaStreaming: {
		question: string;
		answer: string;
		status: 'processing' | 'fail';
		toolActivities: QaToolActivityEntry[];
	} | null = null;
	private qaInputValue = '';
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
	private resizeEventWindow: Window | null = null;
	private markdownComponent: Component | null = null;
	private readonly handleWindowResize = () => {
		if (!this.containerEl) {
			return;
		}

		this.refreshAdaptiveLayout();
		this.position();
	};

	constructor(
		private readonly app: App,
		private readonly onRetry: (sourceText: string) => void,
		private readonly onClose: CloseHandler,
		private readonly onAsk: AskHandler,
		private readonly onClearQa: ClearQaHandler,
	) {}

	show(task: TranslationTask, options: TranslationPopoverOptions) {
		this.currentTask = task;
		this.ensureContainer();
		this.render(task, options, false);
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
		this.render(task, options, true);
		this.position();
	}

	close() {
		const wasOpen = this.containerEl !== null;
		this.resizeEventWindow?.removeEventListener(
			'resize',
			this.handleWindowResize,
		);
		this.resizeEventWindow = null;
		this.markdownComponent?.unload();
		this.markdownComponent = null;
		this.containerEl?.remove();
		this.containerEl = null;
		this.currentTask = null;
		this.currentOptions = null;
		this.dragState = null;
		this.resizeState = null;
		this.isUserPositioned = false;
		this.isUserSized = false;
		this.qaExpanded = false;
		this.qaHistory = [];
		this.qaStreaming = null;
		this.qaInputValue = '';
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
		if (!this.markdownComponent) {
			this.markdownComponent = new Component();
			this.markdownComponent.load();
		}
		this.resizeEventWindow = activeWindow;
		this.resizeEventWindow.addEventListener('resize', this.handleWindowResize);
	}

	private render(
		task: TranslationTask,
		options: TranslationPopoverOptions,
		preserveSourceInput: boolean,
	) {
		if (!this.containerEl) {
			return;
		}

		const sourceText = preserveSourceInput
			? getSourceInputValue(this.containerEl) ?? task.raw
			: task.raw;

		if (preserveSourceInput) {
			this.qaInputValue =
				getQaInputValue(this.containerEl) ?? this.qaInputValue;
		}
		const qaInputHadFocus =
			preserveSourceInput && this.qaExpanded
				? isQaInputFocused(this.containerEl)
				: false;

		this.currentOptions = options;
		this.containerEl.replaceChildren();
		this.containerEl.appendChild(this.createHeader(task));

		const contentEl = activeDocument.createElement('div');
		contentEl.className = 'selection-translator-popover__content';
		if (options.showSelectedText) {
			contentEl.appendChild(
				createEditableSection(t('popoverSelectedText'), sourceText),
			);
		}

		const resultText = getResultText(task);
		contentEl.appendChild(
			createResultSection(getResultLabel(task), resultText, task.audio),
		);
		if (options.qaEnabled) {
			contentEl.appendChild(this.createQaSection());
		}
		this.containerEl.appendChild(contentEl);
		this.containerEl.appendChild(this.createResizeHandle());
		this.refreshAdaptiveLayout();

		if (qaInputHadFocus) {
			focusQaInput(this.containerEl);
		}
	}

	private renderIdle() {
		if (!this.containerEl) {
			return;
		}

		this.containerEl.replaceChildren();
		this.containerEl.appendChild(this.createHeader(null));
		const contentEl = activeDocument.createElement('div');
		contentEl.className = 'selection-translator-popover__content';
		contentEl.appendChild(
			createSection(t('popoverStatus'), t('popoverIdle')),
		);
		this.containerEl.appendChild(contentEl);
		this.containerEl.appendChild(this.createResizeHandle());
		this.refreshAdaptiveLayout();
	}

	private createHeader(task: TranslationTask | null) {
		const headerEl = activeDocument.createElement('div');
		headerEl.className = 'selection-translator-popover__header';
		headerEl.addEventListener('pointerdown', (event) => {
			this.handlePointerDown(event);
		});

		const titleEl = activeDocument.createElement('div');
		titleEl.className = 'selection-translator-popover__title';
		titleEl.textContent = t('popoverTitle');
		headerEl.appendChild(titleEl);

		const actionsEl = activeDocument.createElement('div');
		actionsEl.className = 'selection-translator-popover__header-actions';

		const copyButton = createIconButton('copy', t('popoverCopy'));
		copyButton.disabled = !task?.result;
		copyButton.addEventListener('click', () => {
			void copyToClipboard(task?.result ?? '');
		});
		actionsEl.appendChild(copyButton);

		const retryButton = createIconButton('refresh-cw', t('popoverRetry'));
		retryButton.disabled = !task || task.status === 'processing';
		retryButton.addEventListener('click', () => {
			if (!task) {
				return;
			}
			this.onRetry(getSourceInputValue(this.containerEl) ?? task.raw);
		});
		actionsEl.appendChild(retryButton);

		const closeButton = createIconButton('x', t('popoverCloseTranslation'));
		closeButton.addEventListener('click', () => this.close());
		actionsEl.appendChild(closeButton);

		headerEl.appendChild(actionsEl);

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

	private refreshAdaptiveLayout() {
		if (!this.containerEl) {
			return;
		}

		const textAreas = getPopoverTextAreas(this.containerEl);
		if (!this.isUserSized) {
			this.containerEl.style.removeProperty('height');
			this.containerEl.setCssProps({
				width: `${getAdaptivePopoverWidth(textAreas)}px`,
			});
		}

		this.fitTextAreas(textAreas);
	}

	private fitTextAreas(textAreas: HTMLTextAreaElement[]) {
		if (textAreas.length === 0) {
			return;
		}

		const isSplitLayout =
			this.containerEl !== null &&
			textAreas.length > 1 &&
			this.containerEl.offsetWidth >= SPLIT_LAYOUT_MIN_WIDTH;
		const maxHeight = getMaxTextAreaHeight(textAreas.length, isSplitLayout);
		for (const textArea of textAreas) {
			textArea.setCssProps({ height: 'auto' });
			textArea.setCssProps({
				height: `${clamp(
					textArea.scrollHeight,
					TEXT_AREA_MIN_HEIGHT,
					maxHeight,
				)}px`,
			});
		}
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
		if (
			!this.containerEl ||
			event.button !== 0 ||
			isInteractiveTarget(event.target)
		) {
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
		this.fitTextAreas(getPopoverTextAreas(this.containerEl));
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

		this.fitTextAreas(getPopoverTextAreas(this.containerEl));
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
			this.fitTextAreas(getPopoverTextAreas(this.containerEl));
		}

		const updatedRect = this.containerEl.getBoundingClientRect();
		this.containerEl.setCssProps({
			left: `${clamp(
				updatedRect.left,
				8,
				activeWindow.innerWidth - this.containerEl.offsetWidth - 8,
			)}px`,
			top: `${clamp(
				updatedRect.top,
				8,
				activeWindow.innerHeight - this.containerEl.offsetHeight - 8,
			)}px`,
		});
	}

	// --- Q&A section ---

	private createQaSection(): HTMLElement {
		const sectionEl = activeDocument.createElement('section');
		sectionEl.className = 'selection-translator-popover__qa';

		const configReady = this.currentOptions?.qaConfigReady ?? false;
		const toggleRow = this.createQaToggleRow(configReady);
		sectionEl.appendChild(toggleRow);

		if (this.qaExpanded) {
			sectionEl.appendChild(this.createQaBody());
		}

		return sectionEl;
	}

	private createQaToggleRow(configReady: boolean): HTMLElement {
		const rowEl = activeDocument.createElement('div');
		rowEl.className = 'selection-translator-popover__qa-toggle';

		const toggleButton = activeDocument.createElement('button');
		toggleButton.type = 'button';
		toggleButton.className =
			'selection-translator-popover__qa-toggle-button';
		toggleButton.textContent = t('popoverQaToggle');
		toggleButton.setAttribute('aria-expanded', String(this.qaExpanded));
		if (!configReady) {
			toggleButton.disabled = true;
			toggleButton.setAttribute(
				'title',
				t('popoverQaDisabledTooltip'),
			);
			toggleButton.setAttribute('aria-label', t('popoverQaToggle'));
		} else {
			toggleButton.setAttribute('title', t('popoverQaToggle'));
			toggleButton.setAttribute('aria-label', t('popoverQaToggle'));
			toggleButton.addEventListener('click', () => {
				this.qaExpanded = !this.qaExpanded;
				this.rebuildQaSection();
			});
		}
		rowEl.appendChild(toggleButton);

		const chevron = activeDocument.createElement('span');
		chevron.className = 'selection-translator-popover__qa-chevron';
		setIcon(chevron, this.qaExpanded ? 'chevron-down' : 'chevron-right');
		chevron.setAttribute('aria-hidden', 'true');
		rowEl.appendChild(chevron);

		if (this.qaExpanded) {
			const clearButton = createIconButton('trash', t('popoverQaClear'));
			clearButton.classList.add(
				'selection-translator-popover__qa-clear',
			);
			clearButton.disabled = this.qaStreaming?.status === 'processing';
			clearButton.addEventListener('click', () => this.onClearQa());
			rowEl.appendChild(clearButton);
		}

		return rowEl;
	}

	private createQaBody(): HTMLElement {
		const bodyEl = activeDocument.createElement('div');
		bodyEl.className = 'selection-translator-popover__qa-body';

		const historyEl = activeDocument.createElement('div');
		historyEl.className = 'selection-translator-popover__qa-history';
		this.populateQaHistory(historyEl);
		bodyEl.appendChild(historyEl);

		bodyEl.appendChild(this.createQaInputRow());

		return bodyEl;
	}

	private createQaInputRow(): HTMLElement {
		const inputRowEl = activeDocument.createElement('div');
		inputRowEl.className = 'selection-translator-popover__qa-input';

		const textareaEl = activeDocument.createElement('textarea');
		textareaEl.className = 'selection-translator-popover__qa-input-area';
		textareaEl.rows = 2;
		textareaEl.placeholder = t('popoverQaInputPlaceholder');
		textareaEl.value = this.qaInputValue;
		textareaEl.setAttribute('aria-label', t('popoverQaInputPlaceholder'));
		textareaEl.addEventListener('input', () => {
			this.qaInputValue = textareaEl.value;
		});
		textareaEl.addEventListener('keydown', (event) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.key === 'Enter'
			) {
				event.preventDefault();
				this.sendQaQuestion(textareaEl);
			}
		});
		inputRowEl.appendChild(textareaEl);

		const sendButton = activeDocument.createElement('button');
		sendButton.type = 'button';
		sendButton.className =
			'clickable-icon selection-translator-popover__qa-send';
		sendButton.setAttribute('aria-label', t('popoverQaSend'));
		sendButton.setAttribute('title', t('popoverQaSend'));
		setIcon(sendButton, 'send');
		sendButton.addEventListener('click', () => {
			this.sendQaQuestion(textareaEl);
		});
		inputRowEl.appendChild(sendButton);

		return inputRowEl;
	}

	private sendQaQuestion(textareaEl: HTMLTextAreaElement) {
		const question = textareaEl.value.trim();
		if (!question || this.qaStreaming?.status === 'processing') {
			return;
		}
		textareaEl.value = '';
		this.qaInputValue = '';
		this.onAsk(question);
	}

	private populateQaHistory(historyEl: Element) {
		for (const turn of this.qaHistory) {
			const messageEl = createQaMessage(turn.role, turn.content);
			if (turn.role === 'assistant' && this.markdownComponent) {
				const contentEl = messageEl.querySelector<HTMLElement>(
					'.selection-translator-popover__qa-message-content',
				);
				if (contentEl) {
					renderQaAssistantMarkdown(
						this.app,
						this.markdownComponent,
						contentEl,
						turn.content,
					);
				}
			}
			historyEl.appendChild(messageEl);
		}
		if (this.qaStreaming) {
			historyEl.appendChild(
				createQaMessage('user', this.qaStreaming.question),
			);
			for (const activity of this.qaStreaming.toolActivities) {
				historyEl.appendChild(createQaToolActivityEl(activity));
			}
			const isProcessing = this.qaStreaming.status === 'processing';
			const assistantEl = createQaMessage(
				'assistant',
				this.qaStreaming.answer ||
					(isProcessing ? t('popoverQaThinking') : ''),
			);
			assistantEl.classList.add(
				isProcessing
					? 'selection-translator-popover__qa-message--streaming'
					: 'selection-translator-popover__qa-message--fail',
			);
			historyEl.appendChild(assistantEl);
		}
		historyEl.scrollTop = historyEl.scrollHeight;
	}

	private rebuildQaSection(): void {
		if (!this.containerEl || !this.currentOptions?.qaEnabled) {
			return;
		}
		const oldSection = this.containerEl.querySelector(
			'.selection-translator-popover__qa',
		);
		const newSection = this.createQaSection();
		if (oldSection) {
			oldSection.replaceWith(newSection);
		}
	}

	private rebuildQaHistory(): void {
		const historyEl = this.containerEl?.querySelector(
			'.selection-translator-popover__qa-history',
		);
		if (!historyEl) {
			return;
		}
		historyEl.replaceChildren();
		this.populateQaHistory(historyEl);
	}

	private updateQaClearButton(): void {
		const clearButton = this.containerEl?.querySelector(
			'.selection-translator-popover__qa-clear',
		);
		if (clearButton instanceof HTMLButtonElement) {
			clearButton.disabled = this.qaStreaming?.status === 'processing';
		}
	}

	// --- Q&A incremental streaming API (called by the plugin) ---

	resetQa(): void {
		this.qaHistory = [];
		this.qaStreaming = null;
		this.qaInputValue = '';
	}

	appendQaUserMessage(question: string): void {
		this.qaStreaming = {
			question,
			answer: '',
			status: 'processing',
			toolActivities: [],
		};
		const historyEl = this.containerEl?.querySelector(
			'.selection-translator-popover__qa-history',
		);
		if (historyEl) {
			this.rebuildQaHistory();
			this.updateQaClearButton();
		} else {
			this.qaExpanded = true;
			this.rebuildQaSection();
		}
	}

	appendQaToolActivity(kind: 'search' | 'fetch', detail: string): void {
		if (!this.qaStreaming || this.qaStreaming.status !== 'processing') {
			return;
		}
		this.qaStreaming.toolActivities.push({ kind, detail });
		this.rebuildQaHistory();
	}

	appendQaChunk(chunk: string): void {
		if (this.qaStreaming?.status !== 'processing') {
			return;
		}
		this.qaStreaming.answer += chunk;
		const streamingContent = this.containerEl?.querySelector(
			'.selection-translator-popover__qa-message--streaming .selection-translator-popover__qa-message-content',
		);
		if (streamingContent) {
			streamingContent.textContent = this.qaStreaming.answer;
		}
	}

	finishQaAnswer(): void {
		if (this.qaStreaming?.status !== 'processing') {
			return;
		}
		const finalAnswer = this.qaStreaming.answer;
		const streamingEl = this.containerEl?.querySelector(
			'.selection-translator-popover__qa-message--streaming',
		);
		streamingEl?.classList.remove(
			'selection-translator-popover__qa-message--streaming',
		);
		if (streamingEl && this.markdownComponent) {
			const contentEl = streamingEl.querySelector<HTMLElement>(
				'.selection-translator-popover__qa-message-content',
			);
			if (contentEl) {
				renderQaAssistantMarkdown(
					this.app,
					this.markdownComponent,
					contentEl,
					finalAnswer,
				);
			}
		}
		this.qaHistory.push(
			{ role: 'user', content: this.qaStreaming.question },
			{ role: 'assistant', content: finalAnswer },
		);
		this.qaStreaming = null;
		this.updateQaClearButton();
	}

	failQa(error: string): void {
		if (!this.qaStreaming) {
			return;
		}
		// Keep the failed turn in state (status 'fail') so a translation
		// re-render rebuilds it from `populateQaHistory` instead of dropping
		// the error. It is cleared when the user re-asks or clears.
		this.qaStreaming.status = 'fail';
		this.qaStreaming.answer = t('popoverQaFailed', { message: error });
		this.rebuildQaHistory();
		this.updateQaClearButton();
	}

	clearQaDisplay(): void {
		this.qaHistory = [];
		this.qaStreaming = null;
		this.rebuildQaHistory();
		this.updateQaClearButton();
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

function createResultSection(
	label: string,
	text: string,
	audio: PronunciationAudio[],
) {
	const sectionEl = activeDocument.createElement('section');
	sectionEl.className = 'selection-translator-popover__section';

	const headerEl = activeDocument.createElement('div');
	headerEl.className = 'selection-translator-popover__section-header';

	const labelEl = activeDocument.createElement('span');
	labelEl.className = 'selection-translator-popover__label';
	labelEl.textContent = label;
	headerEl.appendChild(labelEl);

	if (audio.length > 0) {
		headerEl.appendChild(createPronunciationControls(audio));
	}

	sectionEl.appendChild(headerEl);

	const outputEl = activeDocument.createElement('textarea');
	outputEl.className = 'selection-translator-popover__result-output';
	outputEl.readOnly = true;
	outputEl.rows = 3;
	outputEl.value = text;
	outputEl.setAttribute('aria-label', label);
	sectionEl.appendChild(outputEl);

	return sectionEl;
}

function createPronunciationControls(audio: PronunciationAudio[]) {
	const controlsEl = activeDocument.createElement('div');
	controlsEl.className = 'selection-translator-popover__audio-controls';

	for (const item of audio) {
		const button = activeDocument.createElement('button');
		button.type = 'button';
		button.className =
			'clickable-icon selection-translator-popover__audio-button';
		const pronunciationLabel = formatPronunciationLabel(item);
		const title = t('popoverPlayPronunciation', {
			label: pronunciationLabel,
		});
		button.setAttribute('aria-label', title);
		button.setAttribute('title', title);
		setIcon(button, 'volume-2');

		const labelEl = activeDocument.createElement('span');
		labelEl.className = 'selection-translator-popover__audio-label';
		labelEl.textContent = item.label;
		button.appendChild(labelEl);

		button.addEventListener('click', () => {
			void playAudio(item.url);
		});
		controlsEl.appendChild(button);
	}

	return controlsEl;
}

function formatPronunciationLabel(audio: PronunciationAudio) {
	if (!audio.phonetic) {
		return audio.label;
	}
	return `${audio.label} [${audio.phonetic}]`;
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
	inputEl.rows = 3;
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

function getQaInputValue(containerEl: HTMLElement | null) {
	const inputEl = containerEl?.querySelector(
		'.selection-translator-popover__qa-input-area',
	);
	if (!(inputEl instanceof HTMLTextAreaElement)) {
		return null;
	}
	return inputEl.value;
}

function isQaInputFocused(containerEl: HTMLElement | null) {
	const inputEl = containerEl?.querySelector(
		'.selection-translator-popover__qa-input-area',
	);
	return (
		inputEl instanceof HTMLTextAreaElement &&
		activeDocument.activeElement === inputEl
	);
}

function focusQaInput(containerEl: HTMLElement | null) {
	const inputEl = containerEl?.querySelector(
		'.selection-translator-popover__qa-input-area',
	);
	if (inputEl instanceof HTMLTextAreaElement) {
		inputEl.focus();
		const length = inputEl.value.length;
		inputEl.setSelectionRange(length, length);
	}
}

function createQaMessage(role: 'user' | 'assistant', content: string) {
	const messageEl = activeDocument.createElement('div');
	messageEl.className = `selection-translator-popover__qa-message selection-translator-popover__qa-message--${role}`;
	const contentEl = activeDocument.createElement('div');
	contentEl.className = 'selection-translator-popover__qa-message-content';
	contentEl.textContent = content;
	messageEl.appendChild(contentEl);
	return messageEl;
}

function renderQaAssistantMarkdown(
	app: App,
	component: Component,
	contentEl: HTMLElement,
	markdown: string,
): void {
	contentEl.empty();
	contentEl.classList.add(
		'selection-translator-popover__qa-message-content--markdown',
	);
	// MarkdownRenderer.render is async; we don't await it — the caller only
	// needs the DOM to be reasonably filled. If it rejects for any reason
	// (unexpected Obsidian error), fall back to plain text so the answer is
	// never lost.
	void MarkdownRenderer.render(app, markdown, contentEl, '', component).catch(
		() => {
			contentEl.empty();
			contentEl.textContent = markdown;
		},
	);
}

function createQaToolActivityEl(activity: QaToolActivityEntry) {
	const el = activeDocument.createElement('div');
	el.className = 'selection-translator-popover__qa-tool';
	el.textContent =
		activity.kind === 'search'
			? t('popoverQaSearching', { query: activity.detail })
			: t('popoverQaFetching', { url: activity.detail });
	return el;
}

function createIconButton(icon: string, label: string) {
	const button = activeDocument.createElement('button');
	button.type = 'button';
	button.className = 'clickable-icon selection-translator-icon-button';
	button.setAttribute('aria-label', label);
	button.setAttribute('title', label);
	setIcon(button, icon);
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

function isInteractiveTarget(target: EventTarget | null) {
	if (!(target instanceof Element)) {
		return false;
	}
	return target.closest('button, input, textarea, select, a') !== null;
}

function clamp(value: number, min: number, max: number) {
	if (max < min) {
		return min;
	}
	return Math.min(Math.max(value, min), max);
}

function getPopoverTextAreas(containerEl: HTMLElement) {
	return Array.from(
		containerEl.querySelectorAll<HTMLTextAreaElement>(TEXT_AREA_SELECTOR),
	);
}

function getAdaptivePopoverWidth(textAreas: HTMLTextAreaElement[]) {
	const hasSourceInput = textAreas.some((textArea) =>
		textArea.classList.contains('selection-translator-popover__source-input'),
	);
	const longestTextLength = textAreas.reduce(
		(length, textArea) => Math.max(length, textArea.value.length),
		0,
	);
	const preferredWidth = getPreferredPopoverWidth(
		hasSourceInput,
		longestTextLength,
	);
	const maxWidth = Math.min(
		AUTO_POPOVER_MAX_WIDTH,
		activeWindow.innerWidth - AUTO_POPOVER_VIEWPORT_MARGIN,
	);

	return clamp(preferredWidth, getMinPopoverWidth(), maxWidth);
}

function getPreferredPopoverWidth(hasSourceInput: boolean, textLength: number) {
	if (hasSourceInput) {
		return textLength > LONG_TEXT_LENGTH
			? LONG_SPLIT_POPOVER_WIDTH
			: SPLIT_POPOVER_WIDTH;
	}

	if (textLength > LONG_TEXT_LENGTH) {
		return LONG_RESULT_POPOVER_WIDTH;
	}

	if (textLength > MEDIUM_TEXT_LENGTH) {
		return MEDIUM_RESULT_POPOVER_WIDTH;
	}

	return COMPACT_POPOVER_WIDTH;
}

function getMaxTextAreaHeight(textAreaCount: number, isSplitLayout: boolean) {
	const reservedHeight =
		textAreaCount > 1 && !isSplitLayout
			? MULTI_TEXT_AREA_RESERVED_HEIGHT
			: SINGLE_TEXT_AREA_RESERVED_HEIGHT;
	const heightDivisor = isSplitLayout ? 1 : textAreaCount;
	const availableHeight = Math.floor(
		(activeWindow.innerHeight - reservedHeight) / heightDivisor,
	);

	return clamp(availableHeight, TEXT_AREA_MIN_HEIGHT, TEXT_AREA_MAX_HEIGHT);
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

async function playAudio(url: string) {
	const audio = new Audio(url);
	await audio.play();
}
