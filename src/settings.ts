import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';
import type SelectionTranslatorPlugin from './main';
import type { TranslationProviderId } from './services/languageCodes';

export interface SelectionTranslatorSettings {
	provider: TranslationProviderId;
	apiBaseUrl: string;
	apiKey: string;
	model: string;
	microsoftTranslatorKey: string;
	microsoftTranslatorRegion: string;
	microsoftTranslatorEndpoint: string;
	googleTranslateApiKey: string;
	deeplApiKey: string;
	deeplApiBaseUrl: string;
	baiduTranslateAppId: string;
	baiduTranslateSecretKey: string;
	youdaoTranslateAppKey: string;
	youdaoTranslateAppSecret: string;
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
	provider: 'openai',
	apiBaseUrl: 'https://api.openai.com/v1',
	apiKey: '',
	model: '',
	microsoftTranslatorKey: '',
	microsoftTranslatorRegion: '',
	microsoftTranslatorEndpoint: 'https://api.cognitive.microsofttranslator.com',
	googleTranslateApiKey: '',
	deeplApiKey: '',
	deeplApiBaseUrl: 'https://api-free.deepl.com',
	baiduTranslateAppId: '',
	baiduTranslateSecretKey: '',
	youdaoTranslateAppKey: '',
	youdaoTranslateAppSecret: '',
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

const TRANSLATION_PROVIDERS: Array<{
	id: TranslationProviderId;
	labelKey:
		| 'settingsProviderOpenAI'
		| 'settingsProviderMicrosoft'
		| 'settingsProviderGoogle'
		| 'settingsProviderDeepL'
		| 'settingsProviderBaidu'
		| 'settingsProviderYoudao'
		| 'settingsProviderDictionary';
}> = [
	{ id: 'openai', labelKey: 'settingsProviderOpenAI' },
	{ id: 'microsoft', labelKey: 'settingsProviderMicrosoft' },
	{ id: 'google', labelKey: 'settingsProviderGoogle' },
	{ id: 'deepl', labelKey: 'settingsProviderDeepL' },
	{ id: 'baidu', labelKey: 'settingsProviderBaidu' },
	{ id: 'youdao', labelKey: 'settingsProviderYoudao' },
	{ id: 'dictionary', labelKey: 'settingsProviderDictionary' },
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
			.setName(t('settingsTranslationProviderName'))
			.setDesc(t('settingsTranslationProviderDesc'))
			.addDropdown((dropdown) => {
				for (const provider of TRANSLATION_PROVIDERS) {
					dropdown.addOption(provider.id, t(provider.labelKey));
				}
				dropdown
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value as TranslationProviderId;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		switch (this.plugin.settings.provider) {
			case 'openai':
				this.renderOpenAIProviderSettings(containerEl);
				break;
			case 'microsoft':
				this.renderMicrosoftProviderSettings(containerEl);
				break;
			case 'google':
				this.renderGoogleProviderSettings(containerEl);
				break;
			case 'deepl':
				this.renderDeepLProviderSettings(containerEl);
				break;
			case 'baidu':
				this.renderBaiduProviderSettings(containerEl);
				break;
			case 'youdao':
				this.renderYoudaoProviderSettings(containerEl);
				break;
			case 'dictionary':
				this.renderDictionaryProviderSettings(containerEl);
				break;
		}

		this.renderTestProviderSetting(containerEl);
	}

	private renderOpenAIProviderSettings(containerEl: HTMLElement) {
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
	}

	private renderTestProviderSetting(containerEl: HTMLElement) {
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

	private renderMicrosoftProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsMicrosoftTranslatorKeyName'))
			.setDesc(t('settingsMicrosoftTranslatorKeyDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsApiKeyPlaceholder'))
					.setValue(this.plugin.settings.microsoftTranslatorKey)
					.onChange(async (value) => {
						this.plugin.settings.microsoftTranslatorKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settingsMicrosoftTranslatorRegionName'))
			.setDesc(t('settingsMicrosoftTranslatorRegionDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('settingsMicrosoftTranslatorRegionPlaceholder'))
					.setValue(this.plugin.settings.microsoftTranslatorRegion)
					.onChange(async (value) => {
						this.plugin.settings.microsoftTranslatorRegion = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsMicrosoftTranslatorEndpointName'))
			.setDesc(t('settingsMicrosoftTranslatorEndpointDesc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.microsoftTranslatorEndpoint)
					.setValue(this.plugin.settings.microsoftTranslatorEndpoint)
					.onChange(async (value) => {
						this.plugin.settings.microsoftTranslatorEndpoint =
							value.trim() || DEFAULT_SETTINGS.microsoftTranslatorEndpoint;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderGoogleProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsGoogleTranslateApiKeyName'))
			.setDesc(t('settingsGoogleTranslateApiKeyDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsApiKeyPlaceholder'))
					.setValue(this.plugin.settings.googleTranslateApiKey)
					.onChange(async (value) => {
						this.plugin.settings.googleTranslateApiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}

	private renderDeepLProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsDeepLApiKeyName'))
			.setDesc(t('settingsDeepLApiKeyDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsApiKeyPlaceholder'))
					.setValue(this.plugin.settings.deeplApiKey)
					.onChange(async (value) => {
						this.plugin.settings.deeplApiKey = value.trim();
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName(t('settingsDeepLApiBaseUrlName'))
			.setDesc(t('settingsDeepLApiBaseUrlDesc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.deeplApiBaseUrl)
					.setValue(this.plugin.settings.deeplApiBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.deeplApiBaseUrl =
							value.trim() || DEFAULT_SETTINGS.deeplApiBaseUrl;
						await this.plugin.saveSettings();
					}),
			);
	}

	private renderBaiduProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsBaiduTranslateAppIdName'))
			.setDesc(t('settingsBaiduTranslateAppIdDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('settingsBaiduTranslateAppIdPlaceholder'))
					.setValue(this.plugin.settings.baiduTranslateAppId)
					.onChange(async (value) => {
						this.plugin.settings.baiduTranslateAppId = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsBaiduTranslateSecretKeyName'))
			.setDesc(t('settingsBaiduTranslateSecretKeyDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsBaiduTranslateSecretKeyPlaceholder'))
					.setValue(this.plugin.settings.baiduTranslateSecretKey)
					.onChange(async (value) => {
						this.plugin.settings.baiduTranslateSecretKey = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}

	private renderYoudaoProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsYoudaoTranslateAppKeyName'))
			.setDesc(t('settingsYoudaoTranslateAppKeyDesc'))
			.addText((text) =>
				text
					.setPlaceholder(t('settingsYoudaoTranslateAppKeyPlaceholder'))
					.setValue(this.plugin.settings.youdaoTranslateAppKey)
					.onChange(async (value) => {
						this.plugin.settings.youdaoTranslateAppKey = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsYoudaoTranslateAppSecretName'))
			.setDesc(t('settingsYoudaoTranslateAppSecretDesc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder(t('settingsYoudaoTranslateAppSecretPlaceholder'))
					.setValue(this.plugin.settings.youdaoTranslateAppSecret)
					.onChange(async (value) => {
						this.plugin.settings.youdaoTranslateAppSecret = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}

	private renderDictionaryProviderSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsDictionaryProviderName'))
			.setDesc(t('settingsDictionaryProviderDesc'));
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
