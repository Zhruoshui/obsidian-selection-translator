import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { t } from './i18n';
import type SelectionTranslatorPlugin from './main';
import {
	DEFAULT_TEXT_TRANSLATION_PROVIDER,
	resolveTextTranslationProvider,
	type TextTranslationProviderId,
	type TranslationProviderId,
} from './services/languageCodes';

export type DictionaryProviderId = 'youdao' | 'bing' | 'cambridge';

export const DEFAULT_DICTIONARY_PROVIDER: DictionaryProviderId = 'youdao';

export function resolveDictionaryProvider(
	provider: unknown,
): DictionaryProviderId {
	switch (provider) {
		case 'youdao':
		case 'bing':
		case 'cambridge':
			return provider;
		default:
			return DEFAULT_DICTIONARY_PROVIDER;
	}
}

export interface SelectionTranslatorSettings {
	provider: TranslationProviderId;
	dictionaryProvider: DictionaryProviderId;
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
	cacheEnabled: boolean;
	cacheTtlSeconds: number;
	cacheMaxEntries: number;
	throttleMinIntervalMs: number;
	retryEnabled: boolean;
	retryMaxAttempts: number;
	retryBaseDelayMs: number;
	retryMaxDelayMs: number;
	retryJitterRatio: number;
}

export const LEGACY_DEFAULT_PROMPT =
	'Translate the user text into {targetLanguage}. Output only the translated text. Preserve Markdown formatting, code blocks, URLs, proper nouns, terminology, line breaks, and punctuation. Do not explain, summarize, or add commentary.';

export const DEFAULT_PROMPT =
	'Translate the user text from {sourceLanguage} into {targetLanguage}. Output only the translated text. Preserve Markdown formatting, code blocks, URLs, proper nouns, terminology, line breaks, and punctuation. Do not explain, summarize, or add commentary.';

export const DEFAULT_SETTINGS: SelectionTranslatorSettings = {
	provider: DEFAULT_TEXT_TRANSLATION_PROVIDER,
	dictionaryProvider: DEFAULT_DICTIONARY_PROVIDER,
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
	cacheEnabled: true,
	cacheTtlSeconds: 600,
	cacheMaxEntries: 256,
	throttleMinIntervalMs: 1500,
	retryEnabled: true,
	retryMaxAttempts: 2,
	retryBaseDelayMs: 500,
	retryMaxDelayMs: 3000,
	retryJitterRatio: 0.2,
};

type SettingsTabId = 'provider' | 'dictionary' | 'popover' | 'advanced';

const SETTINGS_TABS: Array<{
	id: SettingsTabId;
	labelKey:
		| 'settingsTabProvider'
		| 'settingsTabDictionary'
		| 'settingsTabPopover'
		| 'settingsTabAdvanced';
}> = [
	{ id: 'provider', labelKey: 'settingsTabProvider' },
	{ id: 'dictionary', labelKey: 'settingsTabDictionary' },
	{ id: 'popover', labelKey: 'settingsTabPopover' },
	{ id: 'advanced', labelKey: 'settingsTabAdvanced' },
];

const TRANSLATION_PROVIDERS: Array<{
	id: TextTranslationProviderId;
	labelKey:
		| 'settingsProviderOpenAI'
		| 'settingsProviderMicrosoft'
		| 'settingsProviderGoogle'
		| 'settingsProviderDeepL'
		| 'settingsProviderBaidu'
		| 'settingsProviderYoudao';
}> = [
	{ id: 'openai', labelKey: 'settingsProviderOpenAI' },
	{ id: 'microsoft', labelKey: 'settingsProviderMicrosoft' },
	{ id: 'google', labelKey: 'settingsProviderGoogle' },
	{ id: 'deepl', labelKey: 'settingsProviderDeepL' },
	{ id: 'baidu', labelKey: 'settingsProviderBaidu' },
	{ id: 'youdao', labelKey: 'settingsProviderYoudao' },
];

const DICTIONARY_PROVIDERS: Array<{
	id: DictionaryProviderId;
	labelKey:
		| 'settingsDictionaryProviderYoudao'
		| 'settingsDictionaryProviderBing'
		| 'settingsDictionaryProviderCambridge';
}> = [
	{ id: 'youdao', labelKey: 'settingsDictionaryProviderYoudao' },
	{ id: 'bing', labelKey: 'settingsDictionaryProviderBing' },
	{ id: 'cambridge', labelKey: 'settingsDictionaryProviderCambridge' },
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
			case 'dictionary':
				this.renderDictionarySettings(panelEl);
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
		const selectedProvider = resolveTextTranslationProvider(
			this.plugin.settings.provider,
		);

		new Setting(containerEl)
			.setName(t('settingsTranslationProviderName'))
			.setDesc(t('settingsTranslationProviderDesc'))
			.addDropdown((dropdown) => {
				for (const provider of TRANSLATION_PROVIDERS) {
					dropdown.addOption(provider.id, t(provider.labelKey));
				}
				dropdown
					.setValue(selectedProvider)
					.onChange(async (value) => {
						this.plugin.settings.provider = value as TextTranslationProviderId;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.renderLanguageSettings(containerEl);

		switch (selectedProvider) {
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
		}

		this.renderTestProviderSetting(containerEl);
	}

	private renderDictionarySettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsDictionaryProviderName'))
			.setDesc(t('settingsDictionaryProviderDesc'))
			.addDropdown((dropdown) => {
				for (const provider of DICTIONARY_PROVIDERS) {
					dropdown.addOption(provider.id, t(provider.labelKey));
				}
				dropdown
					.setValue(this.plugin.settings.dictionaryProvider)
					.onChange(async (value) => {
						this.plugin.settings.dictionaryProvider =
							value as DictionaryProviderId;
						await this.plugin.saveSettings();
					});
			});
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

		this.renderOpenAITranslationSettings(containerEl);
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

	private renderLanguageSettings(containerEl: HTMLElement) {
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
	}

	private renderOpenAITranslationSettings(containerEl: HTMLElement) {
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
	}

	private renderAdvancedSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t('settingsAdvancedCacheHeadingName'))
			.setDesc(t('settingsAdvancedCacheHeadingDesc'));

		new Setting(containerEl)
			.setName(t('settingsCacheEnabledName'))
			.setDesc(t('settingsCacheEnabledDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.cacheEnabled)
					.onChange(async (value) => {
						this.plugin.settings.cacheEnabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsCacheTtlName'))
			.setDesc(t('settingsCacheTtlDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.cacheTtlSeconds))
					.setValue(String(this.plugin.settings.cacheTtlSeconds))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && (parsed === 0 || (parsed >= 60 && parsed <= 86400));
						this.plugin.settings.cacheTtlSeconds = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.cacheTtlSeconds;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsCacheMaxEntriesName'))
			.setDesc(t('settingsCacheMaxEntriesDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.cacheMaxEntries))
					.setValue(String(this.plugin.settings.cacheMaxEntries))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 1 && parsed <= 10000;
						this.plugin.settings.cacheMaxEntries = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.cacheMaxEntries;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsAdvancedThrottleHeadingName'))
			.setDesc(t('settingsAdvancedThrottleHeadingDesc'));

		new Setting(containerEl)
			.setName(t('settingsThrottleMinIntervalName'))
			.setDesc(t('settingsThrottleMinIntervalDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.throttleMinIntervalMs))
					.setValue(String(this.plugin.settings.throttleMinIntervalMs))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 60000;
						this.plugin.settings.throttleMinIntervalMs = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.throttleMinIntervalMs;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsAdvancedRetryHeadingName'))
			.setDesc(t('settingsAdvancedRetryHeadingDesc'));

		new Setting(containerEl)
			.setName(t('settingsRetryEnabledName'))
			.setDesc(t('settingsRetryEnabledDesc'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.retryEnabled)
					.onChange(async (value) => {
						this.plugin.settings.retryEnabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsRetryMaxAttemptsName'))
			.setDesc(t('settingsRetryMaxAttemptsDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.retryMaxAttempts))
					.setValue(String(this.plugin.settings.retryMaxAttempts))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 5;
						this.plugin.settings.retryMaxAttempts = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.retryMaxAttempts;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsRetryBaseDelayName'))
			.setDesc(t('settingsRetryBaseDelayDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.retryBaseDelayMs))
					.setValue(String(this.plugin.settings.retryBaseDelayMs))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 10000;
						this.plugin.settings.retryBaseDelayMs = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.retryBaseDelayMs;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsRetryMaxDelayName'))
			.setDesc(t('settingsRetryMaxDelayDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.retryMaxDelayMs))
					.setValue(String(this.plugin.settings.retryMaxDelayMs))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 30000;
						this.plugin.settings.retryMaxDelayMs = valid
							? Math.round(parsed)
							: DEFAULT_SETTINGS.retryMaxDelayMs;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('settingsRetryJitterRatioName'))
			.setDesc(t('settingsRetryJitterRatioDesc'))
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.retryJitterRatio))
					.setValue(String(this.plugin.settings.retryJitterRatio))
					.onChange(async (value) => {
						const parsed = Number(value);
						const valid = Number.isFinite(parsed) && parsed >= 0 && parsed <= 0.5;
						this.plugin.settings.retryJitterRatio = valid
							? parsed
							: DEFAULT_SETTINGS.retryJitterRatio;
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
