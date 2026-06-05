import { Editor, Notice, Plugin } from 'obsidian';
import { registerSelectionTranslationCommands } from './commands/selectionTranslation';
import {
	getCurrentSelection,
	getEditorSelection,
} from './selection/currentSelection';
import { t } from './i18n';
import { OpenAICompatibleChatService } from './services/openAICompatibleChat';
import {
	DEFAULT_SETTINGS,
	LEGACY_DEFAULT_PROMPT,
	SelectionTranslatorSettingTab,
	SelectionTranslatorSettings,
} from './settings';
import {
	appendTaskResult,
	createTranslationTask,
	TranslationTask,
	updateTaskFailure,
	updateTaskProcessing,
	updateTaskSuccess,
} from './translation/task';
import { TranslationPopover } from './ui/translationPopover';

export default class SelectionTranslatorPlugin extends Plugin {
	settings!: SelectionTranslatorSettings;
	private translator!: OpenAICompatibleChatService;
	private popover!: TranslationPopover;
	private currentAbortController: AbortController | null = null;
	private lastTranslatedSelection = '';
	private selectionChangeTimeout: number | null = null;

	async onload() {
		await this.loadSettings();

		this.translator = new OpenAICompatibleChatService();
		this.popover = new TranslationPopover(
			(sourceText) => {
				void this.translateText(sourceText, true);
			},
			() => {
				this.stopCurrentTranslation();
				this.lastTranslatedSelection = '';
			},
			(sourceLanguage, targetLanguage) => {
				void this.updateLanguageSettings(sourceLanguage, targetLanguage);
			},
		);

		registerSelectionTranslationCommands(this);
		this.registerDomEvent(activeDocument, 'selectionchange', () => {
			this.scheduleOpenPopoverSelectionTranslation();
		});
		this.addSettingTab(new SelectionTranslatorSettingTab(this.app, this));
	}

	onunload() {
		this.stopCurrentTranslation();
		this.popover.close();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<SelectionTranslatorSettings>,
		);
		if (this.settings.prompt === LEGACY_DEFAULT_PROMPT) {
			this.settings.prompt = DEFAULT_SETTINGS.prompt;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async testApiConfiguration() {
		await this.translator.testConnection(this.settings);
	}

	async translateSelection(editor: Editor) {
		const selection = getEditorSelection(editor)?.text ?? '';
		await this.translateText(selection, true);
	}

	async translateCurrentSelection() {
		const selection = getCurrentSelection(this.app)?.text ?? '';
		await this.translateText(selection, true);
	}

	async openSelectionTranslator() {
		const selection = getCurrentSelection(this.app)?.text ?? '';
		if (selection) {
			await this.translateText(selection, true);
			return;
		}

		if (!this.popover.isOpen()) {
			this.lastTranslatedSelection = '';
			this.popover.showIdle(this.getPopoverOptions());
		}
	}

	private async translateText(selection: string, showEmptyNotice: boolean) {
		const text = selection.trim();
		if (!text) {
			if (showEmptyNotice) {
				new Notice(t('noticeSelectText'));
			}
			return;
		}

		if (text.length > this.settings.maxSelectionLength) {
			if (showEmptyNotice) {
				new Notice(
					t('noticeSelectionTooLong', {
						limit: this.settings.maxSelectionLength,
					}),
				);
			}
			return;
		}

		this.lastTranslatedSelection = text;
		this.stopCurrentTranslation();
		const task = createTranslationTask(text);
		this.popover.show(task, this.getPopoverOptions());
		await this.runTranslationTask(task);
	}

	private async runTranslationTask(task: TranslationTask) {
		this.stopCurrentTranslation();
		const abortController = new AbortController();
		this.currentAbortController = abortController;

		updateTaskProcessing(task);
		this.popover.update(task, this.getPopoverOptions());

		try {
			const result = await this.translator.translate(task.raw, this.settings, {
				signal: abortController.signal,
				onChunk: (chunk) => {
					appendTaskResult(task, chunk);
					this.popover.update(task, this.getPopoverOptions());
				},
			});
			if (abortController.signal.aborted) {
				return;
			}
			updateTaskSuccess(task, result);
		} catch (error) {
			if (abortController.signal.aborted) {
				return;
			}
			updateTaskFailure(task, getErrorMessage(error));
		} finally {
			if (this.currentAbortController === abortController) {
				this.currentAbortController = null;
			}
		}

		this.popover.update(task, this.getPopoverOptions());
	}

	private getPopoverOptions() {
		return {
			showSelectedText: this.settings.showSelectedTextInPopover,
			showLanguageControls: this.settings.showLanguageControlsInPopover,
			sourceLanguage: this.settings.sourceLanguage,
			targetLanguage: this.settings.targetLanguage,
		};
	}

	private async updateLanguageSettings(
		sourceLanguage: string,
		targetLanguage: string,
	) {
		const normalizedSource =
			sourceLanguage.trim() || DEFAULT_SETTINGS.sourceLanguage;
		const normalizedTarget =
			targetLanguage.trim() || DEFAULT_SETTINGS.targetLanguage;

		if (
			this.settings.sourceLanguage === normalizedSource &&
			this.settings.targetLanguage === normalizedTarget
		) {
			return;
		}

		this.settings.sourceLanguage = normalizedSource;
		this.settings.targetLanguage = normalizedTarget;
		await this.saveSettings();
	}

	private scheduleOpenPopoverSelectionTranslation() {
		if (!this.popover.isOpen()) {
			return;
		}

		if (this.selectionChangeTimeout !== null) {
			window.clearTimeout(this.selectionChangeTimeout);
		}

		this.selectionChangeTimeout = window.setTimeout(() => {
			this.selectionChangeTimeout = null;
			void this.translateCurrentSelectionIfChanged();
		}, 300);
	}

	private async translateCurrentSelectionIfChanged() {
		if (!this.popover.isOpen()) {
			return;
		}

		const selection = getCurrentSelection(this.app)?.text ?? '';
		if (!selection || selection === this.lastTranslatedSelection) {
			return;
		}

		await this.translateText(selection, false);
	}

	private stopCurrentTranslation() {
		if (this.selectionChangeTimeout !== null) {
			window.clearTimeout(this.selectionChangeTimeout);
			this.selectionChangeTimeout = null;
		}

		this.currentAbortController?.abort();
		this.currentAbortController = null;
	}
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
