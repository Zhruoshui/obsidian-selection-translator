import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';
import type SelectionTranslatorPlugin from './main';

export interface SelectionTranslatorSettings {
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	sourceLanguage: string;
	targetLanguage: string;
	prompt: string;
	temperature: number;
	maxSelectionLength: number;
	showSelectedTextInPopover: boolean;
	showLanguageControlsInPopover: boolean;
}

export const LEGACY_DEFAULT_PROMPT =
	'Translate the user text into {targetLanguage}. Output only the translated text. Preserve Markdown formatting, code blocks, URLs, proper nouns, terminology, line breaks, and punctuation. Do not explain, summarize, or add commentary.';

export const DEFAULT_PROMPT =
	'Translate the user text from {sourceLanguage} into {targetLanguage}. Output only the translated text. Preserve Markdown formatting, code blocks, URLs, proper nouns, terminology, line breaks, and punctuation. Do not explain, summarize, or add commentary.';

export const DEFAULT_SETTINGS: SelectionTranslatorSettings = {
	apiBaseUrl: 'https://api.openai.com/v1',
	apiKey: '',
	model: '',
	sourceLanguage: 'Auto',
	targetLanguage: 'Chinese (Simplified)',
	prompt: DEFAULT_PROMPT,
	temperature: 0.2,
	maxSelectionLength: 4000,
	showSelectedTextInPopover: true,
	showLanguageControlsInPopover: true,
};

type SettingsTabId = 'provider' | 'translation' | 'popover' | 'advanced';

const SETTINGS_TABS: Array<{
	id: SettingsTabId;
	labelKey:
		| 'settingsTabProvider'
		| 'settingsTabTranslation'
		| 'settingsTabPopover'
		| 'settingsTabAdvanced';
}> = [
	{ id: 'provider', labelKey: 'settingsTabProvider' },
	{ id: 'translation', labelKey: 'settingsTabTranslation' },
	{ id: 'popover', labelKey: 'settingsTabPopover' },
	{ id: 'advanced', labelKey: 'settingsTabAdvanced' },
];

export class SelectionTranslatorSettingTab extends PluginSettingTab {
	plugin: SelectionTranslatorPlugin;
	private activeTab: SettingsTabId = 'provider';

	constructor(app: App, plugin: SelectionTranslatorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.classList.add('selection-translator-settings');

		const tabsEl = containerEl.ownerDocument.createElement('div');
		tabsEl.className = 'selection-translator-settings__tabs';
		tabsEl.setAttribute('role', 'tablist');

		for (const tab of SETTINGS_TABS) {
			const tabButton = containerEl.ownerDocument.createElement('button');
			tabButton.type = 'button';
			tabButton.className = 'selection-translator-settings__tab';
			tabButton.textContent = t(tab.labelKey);
			tabButton.setAttribute('role', 'tab');
			tabButton.setAttribute(
				'aria-selected',
				String(tab.id === this.activeTab),
			);
			if (tab.id === this.activeTab) {
				tabButton.classList.add('selection-translator-settings__tab--active');
			}
			tabButton.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.display();
			});
			tabsEl.appendChild(tabButton);
		}

		containerEl.appendChild(tabsEl);

		const panelEl = containerEl.ownerDocument.createElement('div');
		panelEl.className = 'selection-translator-settings__panel';
		panelEl.setAttribute('role', 'tabpanel');
		containerEl.appendChild(panelEl);

		switch (this.activeTab) {
			case 'provider':
				this.renderProviderSettings(panelEl);
				return;
			case 'translation':
				this.renderTranslationSettings(panelEl);
				return;
			case 'popover':
				this.renderPopoverSettings(panelEl);
				return;
			case 'advanced':
				this.renderAdvancedSettings(panelEl);
				return;
		}
	}

	private renderProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsProviderHeading'))
			.setDesc(t('settingsProviderDesc'));

		new Setting(containerEl)
			.setName(t('settingsApiBaseUrlName'))
			.setDesc(t('settingsApiBaseUrlDesc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.apiBaseUrl)
					.setValue(this.plugin.settings.apiBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiBaseUrl = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsApiKeyName'))
			.setDesc(t('settingsApiKeyDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsApiKeyPlaceholder'))
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settingsModelName'))
			.setDesc(t('settingsModelDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('settingsModelPlaceholder'))
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsTestName'))
			.setDesc(t('settingsTestDesc'))
			.addButton((button) => {
				button
					.setButtonText(t('settingsTestButton'))
					.onClick(async () => {
						button.buttonEl.disabled = true;
						button.setButtonText(t('settingsTestingButton'));
						try {
							await this.plugin.testApiConfiguration();
							new Notice(t('settingsTestSucceeded'));
						} catch (error) {
							new Notice(
								t('settingsTestFailed', {
									message: getErrorMessage(error),
								}),
							);
						} finally {
							button.setButtonText(t('settingsTestButton'));
							button.buttonEl.disabled = false;
						}
					});
			});
	}

	private renderTranslationSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsSourceLanguageName'))
			.setDesc(t('settingsSourceLanguageDesc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.sourceLanguage)
					.setValue(this.plugin.settings.sourceLanguage)
					.onChange(async (value) => {
						this.plugin.settings.sourceLanguage =
							value.trim() || DEFAULT_SETTINGS.sourceLanguage;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsTargetLanguageName'))
			.setDesc(t('settingsTargetLanguageDesc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.targetLanguage)
					.setValue(this.plugin.settings.targetLanguage)
					.onChange(async (value) => {
						this.plugin.settings.targetLanguage =
							value.trim() || DEFAULT_SETTINGS.targetLanguage;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsPromptName'))
			.setDesc(t('settingsPromptDesc'))
			.addTextArea((text) => {
				text.inputEl.rows = 5;
				text.inputEl.classList.add('selection-translator-settings-prompt');
				text
					.setValue(this.plugin.settings.prompt)
					.onChange(async (value) => {
						this.plugin.settings.prompt = value.trim() || DEFAULT_PROMPT;
						await this.plugin.saveSettings();
					});
			});
	}

	private renderAdvancedSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsTemperatureName'))
			.setDesc(t('settingsTemperatureDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.temperature))
					.setValue(String(this.plugin.settings.temperature))
					.onChange(async (value) => {
						this.plugin.settings.temperature = normalizeNumber(
							value,
							DEFAULT_SETTINGS.temperature,
							0,
							2,
						);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsMaxSelectionLengthName'))
			.setDesc(t('settingsMaxSelectionLengthDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.maxSelectionLength))
					.setValue(String(this.plugin.settings.maxSelectionLength))
					.onChange(async (value) => {
						this.plugin.settings.maxSelectionLength = Math.round(
							normalizeNumber(
								value,
								DEFAULT_SETTINGS.maxSelectionLength,
								1,
								100000,
							),
						);
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderPopoverSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsShowSelectedTextName'))
			.setDesc(t('settingsShowSelectedTextDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showSelectedTextInPopover)
					.onChange(async (value) => {
						this.plugin.settings.showSelectedTextInPopover = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsShowLanguageControlsName'))
			.setDesc(t('settingsShowLanguageControlsDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLanguageControlsInPopover)
					.onChange(async (value) => {
						this.plugin.settings.showLanguageControlsInPopover = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}

function normalizeNumber(
	value: string,
	fallback: number,
	min: number,
	max: number,
) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}
	return Math.min(Math.max(parsed, min), max);
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}
