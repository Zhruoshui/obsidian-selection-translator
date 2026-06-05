import { getLanguage } from 'obsidian';

const en = {
	commandTranslateSelection: 'Translate selection',

	noticeSelectText: 'Select text to translate.',
	noticeSelectionTooLong: 'Selection is too long. Limit: {limit} characters.',

	settingsTabProvider: 'Provider',
	settingsTabDictionary: 'Dictionary',
	settingsTabTranslation: 'Translation',
	settingsTabPopover: 'Popover',
	settingsTabAdvanced: 'Advanced',
	settingsTranslationProviderName: 'Translation provider',
	settingsTranslationProviderDesc:
		'Choose the provider used for text translation. One selected English word is looked up in the dictionary automatically.',
	settingsProviderOpenAI: 'OpenAI-compatible',
	settingsProviderMicrosoft: 'Bing Translate (Microsoft Translator)',
	settingsProviderGoogle: 'Google Cloud Translation',
	settingsProviderDeepL: 'DeepL',
	settingsProviderBaidu: 'Baidu Translate',
	settingsProviderYoudao: 'Youdao Translate',
	settingsProviderHeading: 'OpenAI-compatible chat API',
	settingsProviderDesc:
		'Selected text is sent to this provider when OpenAI-compatible translation is selected.',
	settingsDictionaryProviderName: 'Dictionary provider',
	settingsDictionaryProviderDesc:
		'Choose the dictionary service used when one selected English word is looked up automatically.',
	settingsDictionaryProviderYoudao: 'Youdao Dictionary',
	settingsDictionaryProviderBing: 'Bing Dictionary',
	settingsDictionaryProviderCambridge: 'Cambridge Dictionary',
	settingsApiBaseUrlName: 'API base URL',
	settingsApiBaseUrlDesc: 'Base URL for the provider.',
	settingsApiKeyName: 'API key',
	settingsApiKeyDesc:
		'Stored locally in Obsidian plugin data. It is not encrypted and is never logged by this plugin.',
	settingsApiKeyPlaceholder: 'API key',
	settingsModelName: 'Model',
	settingsModelDesc: 'Model name supported by your provider.',
	settingsModelPlaceholder: 'Model name',
	settingsMicrosoftTranslatorKeyName: 'Bing/Microsoft Translator key',
	settingsMicrosoftTranslatorKeyDesc:
		'Azure Translator resource key. The API has an F0 free tier, but still requires a resource key. Setup: https://learn.microsoft.com/en-us/azure/ai-services/translator/create-translator-resource',
	settingsMicrosoftTranslatorRegionName: 'Bing/Microsoft Translator region',
	settingsMicrosoftTranslatorRegionDesc:
		'Resource region, such as eastasia or global. Leave empty if your endpoint does not require it.',
	settingsMicrosoftTranslatorRegionPlaceholder: 'global',
	settingsMicrosoftTranslatorEndpointName: 'Bing/Microsoft Translator endpoint',
	settingsMicrosoftTranslatorEndpointDesc:
		'Translator endpoint. Leave the default unless your resource uses another endpoint.',
	settingsGoogleTranslateApiKeyName: 'Google Cloud Translation API key',
	settingsGoogleTranslateApiKeyDesc:
		'API key for Google Cloud Translation Basic v2. Monthly free credits may apply, but API calls still require credentials. Setup: https://cloud.google.com/translate/docs/setup',
	settingsDeepLApiKeyName: 'DeepL Auth Key',
	settingsDeepLApiKeyDesc:
		'Authentication key from your DeepL API account. Setup: https://developers.deepl.com/docs/getting-started/auth',
	settingsDeepLApiBaseUrlName: 'DeepL API base URL',
	settingsDeepLApiBaseUrlDesc:
		'Use the free endpoint by default, or switch to the Pro endpoint if needed.',
	settingsBaiduTranslateAppIdName: 'Baidu Translate app ID',
	settingsBaiduTranslateAppIdDesc:
		'App ID from Baidu Translate Open Platform. Docs: https://fanyi-api.baidu.com/doc/21',
	settingsBaiduTranslateAppIdPlaceholder: 'Baidu app ID',
	settingsBaiduTranslateSecretKeyName: 'Baidu Translate secret key',
	settingsBaiduTranslateSecretKeyDesc:
		'Secret key from Baidu Translate Open Platform. Docs: https://fanyi-api.baidu.com/doc/21',
	settingsBaiduTranslateSecretKeyPlaceholder: 'Baidu secret key',
	settingsYoudaoTranslateAppKeyName: 'Youdao Translate app key',
	settingsYoudaoTranslateAppKeyDesc:
		'App key from Youdao Zhiyun translation service. Guide: https://ai.youdao.com/doc.s#guide',
	settingsYoudaoTranslateAppKeyPlaceholder: 'Youdao app key',
	settingsYoudaoTranslateAppSecretName: 'Youdao Translate app secret',
	settingsYoudaoTranslateAppSecretDesc:
		'App secret from Youdao Zhiyun translation service. Guide: https://ai.youdao.com/doc.s#guide',
	settingsYoudaoTranslateAppSecretPlaceholder: 'Youdao app secret',
	settingsTestName: 'Test API configuration',
	settingsTestDesc:
		'Send a short translation request to verify the selected provider configuration.',
	settingsTestButton: 'Test',
	settingsTestingButton: 'Testing...',
	settingsTestSucceeded: 'API configuration test succeeded.',
	settingsTestFailed: 'API configuration test failed: {message}',
	settingsSourceLanguageName: 'Source language',
	settingsSourceLanguageDesc:
		'Default source language. Use Auto for provider-side detection when supported.',
	settingsTargetLanguageName: 'Target language',
	settingsTargetLanguageDesc: 'Default target language for selected text.',
	settingsPromptName: 'Prompt',
	settingsPromptDesc:
		'Used by OpenAI-compatible providers. Use {sourceLanguage} and {targetLanguage} where the configured languages should be inserted.',
	settingsTemperatureName: 'Temperature',
	settingsTemperatureDesc:
		'Lower values keep OpenAI-compatible translations more deterministic.',
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
	popoverPronunciationUk: 'UK',
	popoverPronunciationUs: 'US',
	popoverPlayPronunciation: 'Play {label} pronunciation',
	popoverCopied: 'Translation copied.',

	dictionaryOnlyEnglishWord:
		'Select one English word to look it up in the dictionary.',
	dictionaryNoResult: 'The dictionary service did not return an entry.',

	providerMissingTranslatedText:
		'The provider response did not include translated text.',
	providerMissingApiBaseUrl:
		'Configure an API base URL before translating.',
	providerMissingApiKey: 'Configure an API key before translating.',
	providerMissingModel: 'Configure a model before translating.',
	providerMissingCredential: 'Configure {field} before translating.',
	providerMissingTargetLanguage:
		'Configure a target language supported by the selected provider.',
	providerRequestFailed: 'Translation provider request failed.',
	providerRequestFailedWithCode:
		'Translation provider request failed. Code: {code}',
};

export type TranslationKey = keyof typeof en;
type TranslationDictionary = Record<TranslationKey, string>;
export type TranslationParams = Record<string, string | number>;

const zhCN: TranslationDictionary = {
	commandTranslateSelection: '翻译选中文本',

	noticeSelectText: '请选择要翻译的文本。',
	noticeSelectionTooLong: '选中文本过长。限制：{limit} 个字符。',

	settingsTabProvider: '服务商',
	settingsTabDictionary: '词典',
	settingsTabTranslation: '翻译',
	settingsTabPopover: '悬浮窗',
	settingsTabAdvanced: '高级',
	settingsTranslationProviderName: '翻译服务商',
	settingsTranslationProviderDesc:
		'选择文本翻译使用的服务商。只选择一个英文单词时会自动走词典查询。',
	settingsProviderOpenAI: 'OpenAI 兼容',
	settingsProviderMicrosoft: 'Bing 翻译（Microsoft Translator）',
	settingsProviderGoogle: 'Google 翻译',
	settingsProviderDeepL: 'DeepL',
	settingsProviderBaidu: '百度翻译',
	settingsProviderYoudao: '有道翻译',
	settingsProviderHeading: 'OpenAI 兼容聊天 API',
	settingsProviderDesc:
		'选择 OpenAI 兼容翻译时，选中文本会发送到此服务商。',
	settingsDictionaryProviderName: '词典服务商',
	settingsDictionaryProviderDesc:
		'选择只划中一个英文单词时自动查询的词典服务。',
	settingsDictionaryProviderYoudao: '有道词典',
	settingsDictionaryProviderBing: '必应词典',
	settingsDictionaryProviderCambridge: '剑桥词典',
	settingsApiBaseUrlName: 'API 基础 URL',
	settingsApiBaseUrlDesc: '服务商的基础 URL。',
	settingsApiKeyName: 'API 密钥',
	settingsApiKeyDesc:
		'存储在本地 Obsidian 插件数据中。它不会被加密，本插件也不会记录它。',
	settingsApiKeyPlaceholder: 'API 密钥',
	settingsModelName: '模型',
	settingsModelDesc: '服务商支持的模型名称。',
	settingsModelPlaceholder: '模型名称',
	settingsMicrosoftTranslatorKeyName: 'Bing/Microsoft Translator 密钥',
	settingsMicrosoftTranslatorKeyDesc:
		'Azure Translator 资源密钥。API 有 F0 免费层，但仍需要资源密钥。获取入口：https://learn.microsoft.com/en-us/azure/ai-services/translator/create-translator-resource',
	settingsMicrosoftTranslatorRegionName: 'Bing/Microsoft Translator 区域',
	settingsMicrosoftTranslatorRegionDesc:
		'资源区域，例如 eastasia 或 global。如果当前端点不需要区域，可以留空。',
	settingsMicrosoftTranslatorRegionPlaceholder: 'global',
	settingsMicrosoftTranslatorEndpointName: 'Bing/Microsoft Translator 端点',
	settingsMicrosoftTranslatorEndpointDesc:
		'Translator 端点。除非你的资源使用其他端点，否则保持默认值。',
	settingsGoogleTranslateApiKeyName: 'Google 翻译 API 密钥',
	settingsGoogleTranslateApiKeyDesc:
		'Google Cloud Translation Basic v2 的 API 密钥。可能有每月免费抵扣，但 API 调用仍需要凭据。设置入口：https://cloud.google.com/translate/docs/setup',
	settingsDeepLApiKeyName: 'DeepL Auth Key',
	settingsDeepLApiKeyDesc:
		'DeepL API 账号中的认证密钥。获取入口：https://developers.deepl.com/docs/getting-started/auth',
	settingsDeepLApiBaseUrlName: 'DeepL API 基础 URL',
	settingsDeepLApiBaseUrlDesc:
		'默认使用免费版端点；如果需要，可以切换为 Pro 端点。',
	settingsBaiduTranslateAppIdName: '百度翻译 App ID',
	settingsBaiduTranslateAppIdDesc:
		'百度翻译开放平台中的 App ID。文档：https://fanyi-api.baidu.com/doc/21',
	settingsBaiduTranslateAppIdPlaceholder: '百度 App ID',
	settingsBaiduTranslateSecretKeyName: '百度翻译密钥',
	settingsBaiduTranslateSecretKeyDesc:
		'百度翻译开放平台中的密钥。文档：https://fanyi-api.baidu.com/doc/21',
	settingsBaiduTranslateSecretKeyPlaceholder: '百度密钥',
	settingsYoudaoTranslateAppKeyName: '有道翻译 App Key',
	settingsYoudaoTranslateAppKeyDesc:
		'有道智云翻译服务中的 App Key。新手指南：https://ai.youdao.com/doc.s#guide',
	settingsYoudaoTranslateAppKeyPlaceholder: '有道 App Key',
	settingsYoudaoTranslateAppSecretName: '有道翻译 App Secret',
	settingsYoudaoTranslateAppSecretDesc:
		'有道智云翻译服务中的 App Secret。新手指南：https://ai.youdao.com/doc.s#guide',
	settingsYoudaoTranslateAppSecretPlaceholder: '有道 App Secret',
	settingsTestName: '测试 API 配置',
	settingsTestDesc: '发送一个简短翻译请求来验证当前选择的服务商配置。',
	settingsTestButton: '测试',
	settingsTestingButton: '测试中...',
	settingsTestSucceeded: 'API 配置测试成功。',
	settingsTestFailed: 'API 配置测试失败：{message}',
	settingsSourceLanguageName: '源语言',
	settingsSourceLanguageDesc:
		'默认源语言。使用 Auto 表示由支持的服务商自动识别。',
	settingsTargetLanguageName: '目标语言',
	settingsTargetLanguageDesc: '选中文本的默认目标语言。',
	settingsPromptName: '提示词',
	settingsPromptDesc:
		'OpenAI 兼容服务商会使用提示词。使用 {sourceLanguage} 和 {targetLanguage} 表示语言插入位置。',
	settingsTemperatureName: '温度',
	settingsTemperatureDesc: '较低的值会让 OpenAI 兼容翻译结果更稳定。',
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
	popoverPronunciationUk: '英音',
	popoverPronunciationUs: '美音',
	popoverPlayPronunciation: '播放{label}发音',
	popoverCopied: '译文已复制。',

	dictionaryOnlyEnglishWord: '请选择一个英文单词进行词典查询。',
	dictionaryNoResult: '词典服务没有返回该单词的释义。',

	providerMissingTranslatedText: '服务商响应中没有翻译文本。',
	providerMissingApiBaseUrl: '请先配置 API 基础 URL。',
	providerMissingApiKey: '请先配置 API 密钥。',
	providerMissingModel: '请先配置模型。',
	providerMissingCredential: '请先配置 {field}。',
	providerMissingTargetLanguage: '请配置当前服务商支持的目标语言。',
	providerRequestFailed: '翻译服务请求失败。',
	providerRequestFailedWithCode: '翻译服务请求失败。错误码：{code}',
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
