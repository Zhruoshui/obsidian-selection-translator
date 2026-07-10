import { Editor, Notice, Plugin } from 'obsidian';
import { registerSelectionTranslationCommands } from './commands/selectionTranslation';
import {
	getCurrentSelection,
	getEditorSelection,
} from './selection/currentSelection';
import { t } from './i18n';
import { TranslationService } from './services/translationService';
import { resolveTextTranslationProvider } from './services/languageCodes';
import { resolveSearchProvider } from './services/qa/search';
import { TranslationCache, type CacheConfig } from './services/translationCache';
import { RequestThrottle } from './services/requestThrottle';
import type { RetryConfig } from './services/translationService';
import {
	testChatConnection,
	validateConfig,
	type ChatClientConfig,
} from './services/openAIChatClient';
import {
	QaAgentService,
	type QaAgentConfig,
} from './services/qaAgent';
import {
	DEFAULT_SETTINGS,
	LEGACY_DEFAULT_PROMPT,
	SelectionTranslatorSettingTab,
	SelectionTranslatorSettings,
	resolveDictionaryProvider,
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

const SELECTION_TRANSLATION_DEBOUNCE_MS = 80;
const SELECTION_TRANSLATION_STABLE_DELAY_MS = 250;

export default class SelectionTranslatorPlugin extends Plugin {
	settings!: SelectionTranslatorSettings;
	private translator!: TranslationService;
	private popover!: TranslationPopover;
	private translationCache = new TranslationCache(() => this.buildCacheConfig());
	private requestThrottle = new RequestThrottle();
	private currentAbortController: AbortController | null = null;
	private lastTranslatedSelection = '';
	private selectionChangeTimeout: number | null = null;
	private flushTimeout: number | null = null;
	private qaAgent = new QaAgentService();
	private currentQaAbortController: AbortController | null = null;
	private lastQaContext = '';

	async onload() {
		await this.loadSettings();

		this.translator = new TranslationService();
		this.popover = new TranslationPopover(
			(sourceText) => {
				void this.translateText(sourceText, true);
			},
			() => {
				this.stopCurrentTranslation();
				this.stopCurrentQa();
				this.lastTranslatedSelection = '';
				this.lastQaContext = '';
			},
			(question) => {
				void this.askQuestion(question);
			},
			() => {
				this.clearQa();
			},
		);

		registerSelectionTranslationCommands(this);
		this.registerDomEvent(activeDocument, 'selectionchange', () => {
			this.scheduleOpenPopoverSelectionTranslation();
		});
		this.registerDomEvent(activeDocument, 'pointerup', () => {
			this.flushOpenPopoverSelectionTranslation();
		});
		this.registerDomEvent(activeDocument, 'keyup', () => {
			this.flushOpenPopoverSelectionTranslation();
		});
		this.addSettingTab(new SelectionTranslatorSettingTab(this.app, this));
	}

	onunload() {
		this.stopCurrentTranslation();
		this.stopCurrentQa();
		this.popover.close();
		this.translationCache.invalidate();
	}

	async loadSettings() {
		const savedSettings = ((await this.loadData()) ?? {}) as Partial<
			SelectionTranslatorSettings
		> & {
			showLanguageControlsInPopover?: unknown;
		};
		let shouldSaveSettings = false;

		if ('showLanguageControlsInPopover' in savedSettings) {
			delete savedSettings.showLanguageControlsInPopover;
			shouldSaveSettings = true;
		}

		this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);

		if (this.settings.prompt === LEGACY_DEFAULT_PROMPT) {
			this.settings.prompt = DEFAULT_SETTINGS.prompt;
			shouldSaveSettings = true;
		}

		const textTranslationProvider = resolveTextTranslationProvider(
			this.settings.provider,
		);
		if (textTranslationProvider !== this.settings.provider) {
			this.settings.provider = textTranslationProvider;
			shouldSaveSettings = true;
		}

		const dictionaryProvider = resolveDictionaryProvider(
			this.settings.dictionaryProvider,
		);
		if (dictionaryProvider !== this.settings.dictionaryProvider) {
			this.settings.dictionaryProvider = dictionaryProvider;
			shouldSaveSettings = true;
		}

		const qaSearchProvider = resolveSearchProvider(
			this.settings.qaSearchProvider,
		);
		if (qaSearchProvider !== this.settings.qaSearchProvider) {
			this.settings.qaSearchProvider = qaSearchProvider;
			shouldSaveSettings = true;
		}

		if (shouldSaveSettings) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		this.translationCache.invalidate();
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
			this.popover.showIdle();
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

		if (this.settings.aiQaEnabled && text !== this.lastQaContext) {
			this.stopCurrentQa();
			this.qaAgent.reset(text, this.buildAiConfig());
			this.popover.resetQa();
			this.lastQaContext = text;
		}

		const task = createTranslationTask(text);
		this.popover.show(task, this.getPopoverOptions());

		if (this.tryServeFromCache(task)) {
			return;
		}

		await this.runTranslationTask(task);
	}

	private tryServeFromCache(task: TranslationTask): boolean {
		const cacheKey = this.buildCacheKey(task.raw);
		if (!cacheKey) {
			return false;
		}
		const entry = this.translationCache.get(cacheKey);
		if (!entry) {
			return false;
		}

		updateTaskProcessing(task);
		appendTaskResult(task, entry.result);
		updateTaskSuccess(task, entry.result);
		this.popover.update(task, this.getPopoverOptions());
		return true;
	}

	private buildCacheKey(text: string) {
		const provider = resolveTextTranslationProvider(this.settings.provider);
		return {
			text,
			provider,
			sourceLanguage: this.settings.sourceLanguage,
			targetLanguage: this.settings.targetLanguage,
		};
	}

	private buildCacheConfig(): CacheConfig {
		return {
			enabled: this.settings.cacheEnabled,
			ttlMs: this.settings.cacheTtlSeconds * 1000,
			maxEntries: this.settings.cacheMaxEntries,
		};
	}

	private buildRetryConfig(): RetryConfig {
		return {
			enabled: this.settings.retryEnabled,
			maxAttempts: this.settings.retryMaxAttempts,
			baseDelayMs: this.settings.retryBaseDelayMs,
			maxDelayMs: this.settings.retryMaxDelayMs,
			jitterRatio: this.settings.retryJitterRatio,
		};
	}

	private async runTranslationTask(task: TranslationTask) {
		this.stopCurrentTranslation();
		const abortController = new AbortController();
		this.currentAbortController = abortController;

		updateTaskProcessing(task);
		this.popover.update(task, this.getPopoverOptions());

		try {
			await this.requestThrottle.wait(
				resolveTextTranslationProvider(this.settings.provider),
				abortController.signal,
				this.settings.throttleMinIntervalMs,
			);
			if (abortController.signal.aborted) {
				return;
			}

			const result = await this.translator.translate(task.raw, this.settings, {
				signal: abortController.signal,
				retryConfig: this.buildRetryConfig(),
				onChunk: (chunk) => {
					appendTaskResult(task, chunk);
					this.popover.update(task, this.getPopoverOptions());
				},
			});
			if (abortController.signal.aborted) {
				return;
			}
			updateTaskSuccess(task, result);
			if (typeof result === 'string') {
				const cacheKey = this.buildCacheKey(task.raw);
				if (cacheKey) {
					this.translationCache.set(cacheKey, result);
				}
			}
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
			qaEnabled: this.settings.aiQaEnabled,
			qaConfigReady: this.isAiConfigReady(),
		};
	}

	private scheduleOpenPopoverSelectionTranslation(
		delayMs = SELECTION_TRANSLATION_DEBOUNCE_MS,
	) {
		if (!this.popover.isOpen()) {
			return;
		}

		if (this.selectionChangeTimeout !== null) {
			window.clearTimeout(this.selectionChangeTimeout);
		}

		this.selectionChangeTimeout = window.setTimeout(() => {
			this.selectionChangeTimeout = null;
			void this.translateCurrentSelectionIfChanged();
		}, delayMs);
	}

	private flushOpenPopoverSelectionTranslation() {
		if (!this.popover.isOpen()) {
			return;
		}

		if (this.selectionChangeTimeout !== null) {
			window.clearTimeout(this.selectionChangeTimeout);
			this.selectionChangeTimeout = null;
		}

		if (this.flushTimeout !== null) {
			window.clearTimeout(this.flushTimeout);
		}

		this.flushTimeout = window.setTimeout(() => {
			this.flushTimeout = null;
			void this.translateCurrentSelectionIfChanged();
		}, SELECTION_TRANSLATION_STABLE_DELAY_MS);
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

		if (this.flushTimeout !== null) {
			window.clearTimeout(this.flushTimeout);
			this.flushTimeout = null;
		}

		this.currentAbortController?.abort();
		this.currentAbortController = null;
	}

	// --- AI Q&A ---

	private isAiConfigReady(): boolean {
		return (
			this.settings.aiApiBaseUrl.trim().length > 0 &&
			this.settings.aiApiKey.trim().length > 0 &&
			this.settings.aiModel.trim().length > 0
		);
	}

	private buildAiConfig(): QaAgentConfig {
		return {
			apiBaseUrl: this.settings.aiApiBaseUrl,
			apiKey: this.settings.aiApiKey,
			model: this.settings.aiModel,
			temperature: this.settings.aiTemperature,
			systemPrompt: this.settings.aiSystemPrompt,
			webSearch: {
				enabled: this.settings.qaWebSearchEnabled,
				settings: {
					search: {
						provider: this.settings.qaSearchProvider,
						apiKey: this.settings.qaSearchApiKey,
					},
					searchResultLimit: this.settings.qaSearchResultLimit,
					fetchMaxChars: this.settings.qaFetchMaxChars,
				},
				maxIterations: this.settings.qaMaxToolIterations,
			},
		};
	}

	private stopCurrentQa() {
		this.currentQaAbortController?.abort();
		this.currentQaAbortController = null;
	}

	private async askQuestion(question: string) {
		if (!this.settings.aiQaEnabled) {
			new Notice(t('noticeAiNotEnabled'));
			return;
		}
		if (!this.isAiConfigReady()) {
			new Notice(t('noticeAiConfigIncomplete'));
			return;
		}

		this.stopCurrentQa();
		const abortController = new AbortController();
		this.currentQaAbortController = abortController;
		this.popover.appendQaUserMessage(question);

		try {
			await this.requestThrottle.wait(
				'ai-qa',
				abortController.signal,
				this.settings.throttleMinIntervalMs,
			);
			if (abortController.signal.aborted) {
				return;
			}

			await this.qaAgent.ask(question, this.buildAiConfig(), {
				signal: abortController.signal,
				onChunk: (chunk) => {
					this.popover.appendQaChunk(chunk);
				},
				onToolActivity: (kind, detail) => {
					this.popover.appendQaToolActivity(kind, detail);
				},
			});
			if (abortController.signal.aborted) {
				return;
			}
			this.popover.finishQaAnswer();
		} catch (error) {
			if (abortController.signal.aborted) {
				return;
			}
			this.popover.failQa(getErrorMessage(error));
		} finally {
			if (this.currentQaAbortController === abortController) {
				this.currentQaAbortController = null;
			}
		}
	}

	private clearQa() {
		this.stopCurrentQa();
		this.qaAgent.clear();
		this.popover.clearQaDisplay();
	}

	async testAiConfig() {
		const config = this.buildAiConfig();
		const clientConfig: ChatClientConfig = {
			apiBaseUrl: config.apiBaseUrl,
			apiKey: config.apiKey,
			model: config.model,
			temperature: config.temperature,
		};
		validateConfig(clientConfig);
		await testChatConnection(clientConfig);
	}
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
