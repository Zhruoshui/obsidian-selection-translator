import { getLanguage } from 'obsidian';

const en = {
	commandTranslateSelection: 'Translate selection',

	noticeSelectText: 'Select text to translate.',
	noticeSelectionTooLong: 'Selection is too long. Limit: {limit} characters.',

	settingsTabProvider: 'Provider',
	settingsTabDictionary: 'Dictionary config',
	settingsTabPopover: 'Popover config',
	settingsTabAdvanced: 'Advanced',
	settingsTabAiQa: 'AI Q&A',
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

	settingsAdvancedCacheHeadingName: 'Translation cache',
	settingsAdvancedCacheHeadingDesc:
		'Skip the network when the same text was translated recently.',
	settingsCacheEnabledName: 'Enable cache',
	settingsCacheEnabledDesc:
		'Cache translated text for the duration below. Disable to always hit the network.',
	settingsCacheTtlName: 'Cache TTL (seconds)',
	settingsCacheTtlDesc:
		'How long a cache entry stays valid. 0 = no expiration, 60-86400 seconds otherwise.',
	settingsCacheMaxEntriesName: 'Cache max entries',
	settingsCacheMaxEntriesDesc:
		'Maximum number of cached translations. Oldest entry is dropped first (LRU).',

	settingsAdvancedThrottleHeadingName: 'Request throttle',
	settingsAdvancedThrottleHeadingDesc:
		'Enforce a minimum interval between consecutive translation requests per provider.',
	settingsThrottleMinIntervalName: 'Min interval (ms)',
	settingsThrottleMinIntervalDesc:
		'Wait at least this many ms between calls to the same provider. 0 disables throttling.',

	settingsAdvancedRetryHeadingName: 'Retry policy',
	settingsAdvancedRetryHeadingDesc:
		'Re-send failed translation requests on 429/5xx or known rate-limit errors.',
	settingsRetryEnabledName: 'Enable retry',
	settingsRetryEnabledDesc:
		'Disabled = first failure is thrown immediately. Enable to use the backoff below.',
	settingsRetryMaxAttemptsName: 'Max attempts',
	settingsRetryMaxAttemptsDesc:
		'Total attempts (including the first one). 0 = no retries at all.',
	settingsRetryBaseDelayName: 'Base delay (ms)',
	settingsRetryBaseDelayDesc:
		'Initial backoff delay. Subsequent delays double up to the max below.',
	settingsRetryMaxDelayName: 'Max delay (ms)',
	settingsRetryMaxDelayDesc:
		'Upper bound on the backoff delay (delay × 2^attempt + jitter, clamped).',
	settingsRetryJitterRatioName: 'Jitter ratio',
	settingsRetryJitterRatioDesc:
		'Random jitter as a fraction of the exponential delay (0-0.5).',

	settingsAiQaHeadingName: 'AI Q&A',
	settingsAiQaHeadingDesc:
		'Ask follow-up questions about the selected text from inside the translation popover. This configuration is fully isolated from the translation provider.',
	settingsAiQaEnabledName: 'Enable AI Q&A',
	settingsAiQaEnabledDesc:
		'Show the AI Q&A entry in the translation popover. Off by default.',
	settingsAiApiBaseUrlName: 'AI API base URL',
	settingsAiApiBaseUrlDesc: 'Base URL for the OpenAI-compatible chat API used by AI Q&A.',
	settingsAiApiKeyName: 'AI API key',
	settingsAiApiKeyDesc:
		'Stored locally in Obsidian plugin data. It is not encrypted and is never logged by this plugin.',
	settingsAiApiKeyPlaceholder: 'API key',
	settingsAiModelName: 'AI model',
	settingsAiModelDesc: 'Model name supported by your AI chat API.',
	settingsAiModelPlaceholder: 'Model name',
	settingsAiTemperatureName: 'AI temperature',
	settingsAiTemperatureDesc:
		'Lower values keep AI answers more deterministic.',
	settingsAiSystemPromptName: 'AI system prompt',
	settingsAiSystemPromptDesc:
		'Use {selectedText} where the selected text should be inserted. If omitted, the selected text is appended automatically.',
	settingsAiTestName: 'Test AI configuration',
	settingsAiTestDesc: 'Send a short chat request to verify the AI configuration.',
	settingsAiTestButton: 'Test',
	settingsAiTestingButton: 'Testing...',
	settingsAiTestSucceeded: 'AI configuration test succeeded.',
	settingsAiTestFailed: 'AI configuration test failed: {message}',

	noticeAiConfigIncomplete:
		'AI Q&A is not available: configure API base URL, API key, and model in AI Q&A settings.',
	noticeAiNotEnabled: 'AI Q&A is disabled. Enable it in AI Q&A settings.',

	popoverAriaLabel: 'Selection translation',
	popoverTitle: 'Selection translation',
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

	popoverQaToggle: 'AI Q&A',
	popoverQaInputPlaceholder: 'Ask a question about the selected text...',
	popoverQaSend: 'Send',
	popoverQaClear: 'Clear Q&A history',
	popoverQaThinking: 'Thinking...',
	popoverQaFailed: 'Q&A failed: {message}',
	popoverQaDisabledTooltip:
		'Configure API base URL, API key, and model in AI Q&A settings to enable.',
	popoverQaSearching: '🔍 Searching "{query}"...',
	popoverQaFetching: '📄 Reading {url}...',
	popoverQaToolFailed: '⚠️ Tool "{name}" failed: {message}',

	settingsQaWebSearchHeadingName: 'Web search',
	settingsQaWebSearchHeadingDesc:
		'Give AI Q&A the ability to run web searches and fetch pages before answering. Requires a chat model that supports OpenAI-compatible tool_calls.',
	settingsQaWebSearchEnabledName: 'Enable web search',
	settingsQaWebSearchEnabledDesc:
		'When enabled, the AI can call web_search and fetch_url to look up up-to-date information.',
	settingsQaSearchProviderName: 'Search backend',
	settingsQaSearchProviderDesc:
		'Which search API the web_search tool uses. DuckDuckGo works without an API key but is less reliable.',
	settingsQaSearchProviderTavily: 'Tavily (API key required)',
	settingsQaSearchProviderSerper: 'Serper.dev (API key required)',
	settingsQaSearchProviderDuckDuckGo: 'DuckDuckGo (no API key)',
	settingsQaSearchApiKeyName: 'Search API key',
	settingsQaSearchApiKeyDesc:
		'API key for the selected search backend. Stored locally in Obsidian plugin data.',
	settingsQaSearchApiKeyPlaceholder: 'Search API key',
	settingsQaMaxIterationsName: 'Maximum tool call rounds',
	settingsQaMaxIterationsDesc:
		'Upper bound on how many search / fetch rounds the AI may take before it must finalize an answer.',
	settingsQaSearchResultLimitName: 'Search results per query',
	settingsQaSearchResultLimitDesc: 'How many results the web_search tool returns to the model each call.',
	settingsQaFetchMaxCharsName: 'fetch_url max characters',
	settingsQaFetchMaxCharsDesc:
		'Cap on the extracted page text length passed back to the model. Longer pages are truncated.',

	qaSearchMissingApiKey: '{provider} search API key is not configured.',
	qaSearchProviderFailed: '{provider} search failed: {message}',
	qaSearchEmptyQuery: 'Search query is empty.',
	qaSearchNoResults: 'No results.',
	qaFetchInvalidUrl: 'Invalid URL: {url}',
	qaFetchBlockedHost: 'Refusing to fetch {url} (host is on the private / local blocklist).',
	qaFetchUnsupportedProtocol: 'Refusing to fetch {url} (protocol must be http or https).',
	qaFetchFailed: 'fetch_url failed: {message}',
	qaFetchEmptyBody: 'The page returned an empty body.',
	qaFetchTruncated: '\n\n[truncated at {chars} characters]',
	qaToolUnknownName: 'Unknown tool: {name}',
	qaToolInvalidArguments: 'Could not parse tool arguments for {name}: {message}',
	qaLoopAborted: 'AI Q&A was cancelled.',

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
	settingsTabDictionary: '词典配置',
	settingsTabPopover: '悬浮窗配置',
	settingsTabAdvanced: '高级',
	settingsTabAiQa: 'AI 问答',
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

	settingsAdvancedCacheHeadingName: '翻译缓存',
	settingsAdvancedCacheHeadingDesc: '相同文本近期翻译过则跳过网络请求。',
	settingsCacheEnabledName: '启用缓存',
	settingsCacheEnabledDesc: '将翻译结果在下方时长内缓存。关闭后总是访问网络。',
	settingsCacheTtlName: '缓存有效期（秒）',
	settingsCacheTtlDesc: '缓存条目的有效期。0 表示永不过期，否则范围 60-86400 秒。',
	settingsCacheMaxEntriesName: '缓存最大条目数',
	settingsCacheMaxEntriesDesc: '最多缓存的翻译数。超出时按 LRU 淘汰最旧条目。',

	settingsAdvancedThrottleHeadingName: '请求节流',
	settingsAdvancedThrottleHeadingDesc: '同一服务商两次请求之间的最小间隔。',
	settingsThrottleMinIntervalName: '最小间隔（毫秒）',
	settingsThrottleMinIntervalDesc: '对同一服务商的两次调用之间至少等待这么多毫秒。0 表示不节流。',

	settingsAdvancedRetryHeadingName: '重试策略',
	settingsAdvancedRetryHeadingDesc: '在 429/5xx 或已知限流错误时自动重试翻译请求。',
	settingsRetryEnabledName: '启用重试',
	settingsRetryEnabledDesc: '关闭后首次失败立即抛出错误。开启后按下方退避参数重试。',
	settingsRetryMaxAttemptsName: '最大尝试次数',
	settingsRetryMaxAttemptsDesc: '总尝试次数（含首次）。0 表示完全不重试。',
	settingsRetryBaseDelayName: '基础延迟（毫秒）',
	settingsRetryBaseDelayDesc: '初始退避延迟。后续延迟按指数倍增直到上方上限。',
	settingsRetryMaxDelayName: '最大延迟（毫秒）',
	settingsRetryMaxDelayDesc: '退避延迟的上限（delay × 2^attempt + jitter，截断到该值）。',
	settingsRetryJitterRatioName: '抖动比例',
	settingsRetryJitterRatioDesc: '相对指数延迟的随机抖动比例（0-0.5）。',

	settingsAiQaHeadingName: 'AI 问答',
	settingsAiQaHeadingDesc:
		'在翻译浮窗内对选中文本进行追问。此配置与翻译服务商完全隔离。',
	settingsAiQaEnabledName: '启用 AI 问答',
	settingsAiQaEnabledDesc: '在翻译浮窗中显示 AI 问答入口。默认关闭。',
	settingsAiApiBaseUrlName: 'AI API 基础 URL',
	settingsAiApiBaseUrlDesc: 'AI 问答使用的 OpenAI 兼容聊天 API 基础 URL。',
	settingsAiApiKeyName: 'AI API 密钥',
	settingsAiApiKeyDesc:
		'存储在本地 Obsidian 插件数据中。它不会被加密，本插件也不会记录它。',
	settingsAiApiKeyPlaceholder: 'API 密钥',
	settingsAiModelName: 'AI 模型',
	settingsAiModelDesc: 'AI 聊天 API 支持的模型名称。',
	settingsAiModelPlaceholder: '模型名称',
	settingsAiTemperatureName: 'AI 温度',
	settingsAiTemperatureDesc: '较低的值会让 AI 回答更稳定。',
	settingsAiSystemPromptName: 'AI 系统提示词',
	settingsAiSystemPromptDesc:
		'使用 {selectedText} 表示选中文本的插入位置。如果不包含该占位符，选中文本会自动追加到末尾。',
	settingsAiTestName: '测试 AI 配置',
	settingsAiTestDesc: '发送一个简短的聊天请求来验证 AI 配置。',
	settingsAiTestButton: '测试',
	settingsAiTestingButton: '测试中...',
	settingsAiTestSucceeded: 'AI 配置测试成功。',
	settingsAiTestFailed: 'AI 配置测试失败：{message}',

	noticeAiConfigIncomplete:
		'AI 问答不可用：请在 AI 问答设置中配置 API 基础 URL、API 密钥和模型。',
	noticeAiNotEnabled: 'AI 问答已关闭。请在 AI 问答设置中启用。',

	popoverAriaLabel: '划词翻译',
	popoverTitle: '划词翻译',
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

	popoverQaToggle: 'AI 问答',
	popoverQaInputPlaceholder: '对选中文本提问...',
	popoverQaSend: '发送',
	popoverQaClear: '清空问答历史',
	popoverQaThinking: '思考中...',
	popoverQaFailed: '问答失败：{message}',
	popoverQaDisabledTooltip: '请在 AI 问答设置中配置 API 基础 URL、API 密钥和模型以启用。',
	popoverQaSearching: '🔍 正在搜索 "{query}"...',
	popoverQaFetching: '📄 正在读取 {url}...',
	popoverQaToolFailed: '⚠️ 工具「{name}」执行失败：{message}',

	settingsQaWebSearchHeadingName: '联网搜索',
	settingsQaWebSearchHeadingDesc:
		'为 AI 问答启用联网搜索与网页抓取工具。需要聊天模型支持 OpenAI 兼容的 tool_calls。',
	settingsQaWebSearchEnabledName: '启用联网搜索',
	settingsQaWebSearchEnabledDesc:
		'启用后 AI 可以调用 web_search 与 fetch_url 工具查询最新信息。',
	settingsQaSearchProviderName: '搜索后端',
	settingsQaSearchProviderDesc:
		'web_search 工具使用的搜索 API。DuckDuckGo 无需 API 密钥，但稳定性较差。',
	settingsQaSearchProviderTavily: 'Tavily（需要 API 密钥）',
	settingsQaSearchProviderSerper: 'Serper.dev（需要 API 密钥）',
	settingsQaSearchProviderDuckDuckGo: 'DuckDuckGo（无需 API 密钥）',
	settingsQaSearchApiKeyName: '搜索 API 密钥',
	settingsQaSearchApiKeyDesc:
		'当前所选搜索后端的 API 密钥。本地保存于 Obsidian 插件数据中。',
	settingsQaSearchApiKeyPlaceholder: '搜索 API 密钥',
	settingsQaMaxIterationsName: '最大工具调用轮数',
	settingsQaMaxIterationsDesc:
		'AI 在给出最终答案之前，最多可以进行多少轮搜索 / 抓取工具调用。',
	settingsQaSearchResultLimitName: '每次搜索返回结果数',
	settingsQaSearchResultLimitDesc: 'web_search 工具每次返回给模型的搜索结果条数。',
	settingsQaFetchMaxCharsName: 'fetch_url 抓取字符上限',
	settingsQaFetchMaxCharsDesc:
		'传给模型的网页正文最大字符数，超过则截断。',

	qaSearchMissingApiKey: '尚未配置 {provider} 搜索 API 密钥。',
	qaSearchProviderFailed: '{provider} 搜索失败：{message}',
	qaSearchEmptyQuery: '搜索关键词为空。',
	qaSearchNoResults: '没有搜索结果。',
	qaFetchInvalidUrl: 'URL 无效：{url}',
	qaFetchBlockedHost: '拒绝抓取 {url}（主机命中私有 / 本地黑名单）。',
	qaFetchUnsupportedProtocol: '拒绝抓取 {url}（协议必须为 http 或 https）。',
	qaFetchFailed: 'fetch_url 执行失败：{message}',
	qaFetchEmptyBody: '页面返回内容为空。',
	qaFetchTruncated: '\n\n[已在 {chars} 字符处截断]',
	qaToolUnknownName: '未知工具：{name}',
	qaToolInvalidArguments: '无法解析工具 {name} 的参数：{message}',
	qaLoopAborted: 'AI 问答已中止。',

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
