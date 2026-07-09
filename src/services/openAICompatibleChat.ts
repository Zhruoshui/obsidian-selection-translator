import {
	DEFAULT_SETTINGS,
	type SelectionTranslatorSettings,
} from '../settings';
import {
	type ChatClientConfig,
	type ChatMessage,
	requestChatCompletion,
	testChatConnection,
	validateConfig,
} from './openAIChatClient';

interface TranslationRequestOptions {
	signal?: AbortSignal;
	onChunk?: (chunk: string) => void;
}

export class OpenAICompatibleChatService {
	async translate(
		text: string,
		settings: SelectionTranslatorSettings,
		options: TranslationRequestOptions = {},
	) {
		const config = buildClientConfig(settings);
		validateConfig(config);

		const messages: ChatMessage[] = [
			{
				role: 'system',
				content: buildPrompt(settings),
			},
			{
				role: 'user',
				content: text,
			},
		];

		return requestChatCompletion(messages, config, options);
	}

	async testConnection(settings: SelectionTranslatorSettings) {
		const config = buildClientConfig(settings);
		await testChatConnection(config);
	}
}

function buildClientConfig(
	settings: SelectionTranslatorSettings,
): ChatClientConfig {
	return {
		apiBaseUrl: settings.apiBaseUrl,
		apiKey: settings.apiKey,
		model: settings.model,
		temperature: settings.temperature,
	};
}

function buildPrompt(settings: SelectionTranslatorSettings) {
	const sourceLanguage = getPromptSourceLanguage(settings.sourceLanguage);
	const targetLanguage =
		settings.targetLanguage.trim() || DEFAULT_SETTINGS.targetLanguage;
	const missingDirectives: string[] = [];

	if (!settings.prompt.includes('{sourceLanguage}')) {
		missingDirectives.push(`Source language: ${sourceLanguage}`);
	}
	if (!settings.prompt.includes('{targetLanguage}')) {
		missingDirectives.push(`Target language: ${targetLanguage}`);
	}

	const prompt = settings.prompt
		.replaceAll('{sourceLanguage}', sourceLanguage)
		.replaceAll('{targetLanguage}', targetLanguage);

	if (missingDirectives.length === 0) {
		return prompt;
	}

	return `${missingDirectives.join('\n')}\n\n${prompt}`;
}

function getPromptSourceLanguage(sourceLanguage: string) {
	const normalized = sourceLanguage.trim();
	if (!normalized || normalized.toLowerCase() === 'auto') {
		return 'the auto-detected source language';
	}
	return normalized;
}
