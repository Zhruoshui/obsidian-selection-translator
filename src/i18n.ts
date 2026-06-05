import { getLanguage } from 'obsidian';

const en = {
	commandTranslateSelection: 'Translate selection',

	noticeSelectText: 'Select text to translate.',
	noticeSelectionTooLong: 'Selection is too long. Limit: {limit} characters.',

	settingsTabProvider: 'Provider',
	settingsTabTranslation: 'Translation',
	settingsTabPopover: 'Popover',
	settingsTabAdvanced: 'Advanced',
	settingsProviderHeading: 'OpenAI-compatible chat API',
	settingsProviderDesc:
		'Selected text is sent to the configured provider when you run translation.',
	settingsApiBaseUrlName: 'API base URL',
	settingsApiBaseUrlDesc: 'Base URL for the provider.',
	settingsApiKeyName: 'API key',
	settingsApiKeyDesc:
		'Stored locally in Obsidian plugin data. It is not encrypted and is never logged by this plugin.',
	settingsApiKeyPlaceholder: 'API key',
	settingsModelName: 'Model',
	settingsModelDesc: 'Model name supported by your provider.',
	settingsModelPlaceholder: 'Model name',
	settingsTestName: 'Test API configuration',
	settingsTestDesc:
		'Send a short request to verify the base URL, API key, and model.',
	settingsTestButton: 'Test',
	settingsTestingButton: 'Testing...',
	settingsTestSucceeded: 'API configuration test succeeded.',
	settingsTestFailed: 'API configuration test failed: {message}',
	settingsSourceLanguageName: 'Source language',
	settingsSourceLanguageDesc:
		'Default source language. Use Auto to let the model detect it.',
	settingsTargetLanguageName: 'Target language',
	settingsTargetLanguageDesc: 'Default target language for selected text.',
	settingsPromptName: 'Prompt',
	settingsPromptDesc:
		'Use {sourceLanguage} and {targetLanguage} where the configured languages should be inserted.',
	settingsTemperatureName: 'Temperature',
	settingsTemperatureDesc: 'Lower values keep translations more deterministic.',
	settingsMaxSelectionLengthName: 'Maximum selection length',
	settingsMaxSelectionLengthDesc:
		'Longer selections are blocked to avoid accidental large sends.',
	settingsShowSelectedTextName: 'Show selected text in popover',
	settingsShowSelectedTextDesc:
		'Display the selected text as an editable field before translating again.',
	settingsShowLanguageControlsName: 'Show language controls in popover',
	settingsShowLanguageControlsDesc:
		'Display source and target language fields in the translation popover header.',

	popoverAriaLabel: 'Selection translation',
	popoverTitle: 'Selection translation',
	popoverSourceLanguage: 'From',
	popoverSourceLanguagePlaceholder: 'Auto',
	popoverTargetLanguage: 'To',
	popoverTargetLanguagePlaceholder: 'Target language',
	popoverSelectedText: 'Selected text',
	popoverSelectedTextPlaceholder: 'Edit text to translate',
	popoverCopy: 'Copy',
	popoverRetry: 'Translate again',
	popoverStatus: 'Status',
	popoverError: 'Error',
	popoverTranslation: 'Translation',
	popoverTranslating: 'Translating...',
	popoverTranslationFailed: 'Translation failed.',
	popoverWaiting: 'Waiting...',
	popoverIdle: 'Select text in Markdown or PDF to translate.',
	popoverCloseTranslation: 'Close translation',
	popoverResizeAriaLabel: 'Resize translation popover',
	popoverResizeTitle: 'Resize',
	popoverCopied: 'Translation copied.',

	providerMissingTranslatedText:
		'The provider response did not include translated text.',
	providerMissingApiBaseUrl:
		'Configure an API base URL before translating.',
	providerMissingApiKey: 'Configure an API key before translating.',
	providerMissingModel: 'Configure a model before translating.',
	providerRequestFailed: 'Translation provider request failed.',
};

export type TranslationKey = keyof typeof en;
type TranslationDictionary = Record<TranslationKey, string>;
export type TranslationParams = Record<string, string | number>;

const zhCN: TranslationDictionary = {
	commandTranslateSelection: '翻译选中文本',

	noticeSelectText: '请选择要翻译的文本。',
	noticeSelectionTooLong: '选中文本过长。限制：{limit} 个字符。',

	settingsTabProvider: '服务商',
	settingsTabTranslation: '翻译',
	settingsTabPopover: '悬浮窗',
	settingsTabAdvanced: '高级',
	settingsProviderHeading: 'OpenAI 兼容聊天 API',
	settingsProviderDesc: '运行翻译时，选中文本会发送到已配置的服务商。',
	settingsApiBaseUrlName: 'API 基础 URL',
	settingsApiBaseUrlDesc: '服务商的基础 URL。',
	settingsApiKeyName: 'API 密钥',
	settingsApiKeyDesc:
		'存储在本地 Obsidian 插件数据中。它不会被加密，本插件也不会记录它。',
	settingsApiKeyPlaceholder: 'API 密钥',
	settingsModelName: '模型',
	settingsModelDesc: '服务商支持的模型名称。',
	settingsModelPlaceholder: '模型名称',
	settingsTestName: '测试 API 配置',
	settingsTestDesc: '发送一个简短请求来验证基础 URL、API 密钥和模型。',
	settingsTestButton: '测试',
	settingsTestingButton: '测试中...',
	settingsTestSucceeded: 'API 配置测试成功。',
	settingsTestFailed: 'API 配置测试失败：{message}',
	settingsSourceLanguageName: '源语言',
	settingsSourceLanguageDesc: '默认源语言。使用 Auto 表示由模型自动识别。',
	settingsTargetLanguageName: '目标语言',
	settingsTargetLanguageDesc: '选中文本的默认目标语言。',
	settingsPromptName: '提示词',
	settingsPromptDesc: '使用 {sourceLanguage} 和 {targetLanguage} 表示语言插入位置。',
	settingsTemperatureName: '温度',
	settingsTemperatureDesc: '较低的值会让翻译结果更稳定。',
	settingsMaxSelectionLengthName: '最大选中文本长度',
	settingsMaxSelectionLengthDesc: '阻止过长文本，避免意外发送大量内容。',
	settingsShowSelectedTextName: '在悬浮窗显示选中文本',
	settingsShowSelectedTextDesc:
		'将选中文本显示为可编辑输入框，便于修改后重新翻译。',
	settingsShowLanguageControlsName: '在悬浮窗显示语言设置',
	settingsShowLanguageControlsDesc: '在翻译悬浮窗顶部显示源语言和目标语言输入框。',

	popoverAriaLabel: '划词翻译',
	popoverTitle: '划词翻译',
	popoverSourceLanguage: '源',
	popoverSourceLanguagePlaceholder: 'Auto',
	popoverTargetLanguage: '目标',
	popoverTargetLanguagePlaceholder: '目标语言',
	popoverSelectedText: '选中文本',
	popoverSelectedTextPlaceholder: '编辑要翻译的文本',
	popoverCopy: '复制',
	popoverRetry: '重新翻译',
	popoverStatus: '状态',
	popoverError: '错误',
	popoverTranslation: '译文',
	popoverTranslating: '翻译中...',
	popoverTranslationFailed: '翻译失败。',
	popoverWaiting: '等待中...',
	popoverIdle: '选择 Markdown 或 PDF 文本后即可翻译。',
	popoverCloseTranslation: '关闭翻译',
	popoverResizeAriaLabel: '调整翻译悬浮窗大小',
	popoverResizeTitle: '调整大小',
	popoverCopied: '译文已复制。',

	providerMissingTranslatedText: '服务商响应中没有翻译文本。',
	providerMissingApiBaseUrl: '请先配置 API 基础 URL。',
	providerMissingApiKey: '请先配置 API 密钥。',
	providerMissingModel: '请先配置模型。',
	providerRequestFailed: '翻译服务请求失败。',
};

export function t(key: TranslationKey, params?: TranslationParams): string {
	return interpolate(getDictionary()[key] ?? en[key], params);
}

function getDictionary(): TranslationDictionary {
	switch (getLocale()) {
		case 'zh-CN':
			return zhCN;
		case 'en':
			return en;
	}
}

function getLocale(): 'en' | 'zh-CN' {
	const language = getLanguage().toLowerCase();
	if (
		language === 'zh' ||
		language.startsWith('zh-cn') ||
		language.startsWith('zh-hans')
	) {
		return 'zh-CN';
	}
	return 'en';
}

function interpolate(template: string, params?: TranslationParams) {
	if (!params) {
		return template;
	}

	return template.replace(
		/\{([a-zA-Z0-9_]+)\}/g,
		(match: string, name: string) => {
			if (Object.prototype.hasOwnProperty.call(params, name)) {
				return String(params[name]);
			}
			return match;
		},
	);
}
