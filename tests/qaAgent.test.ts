import { describe, expect, it, vi, beforeEach } from 'vitest';

// Hoist the mock so the factory can reference it. `requestChatCompletion` is
// the only runtime value `qaAgent` imports from the shared client, so stubbing
// it keeps the Q&A tests network-free.
const mocks = vi.hoisted(() => ({
	requestChatCompletion: vi.fn(),
}));

vi.mock('../src/services/openAIChatClient', () => ({
	requestChatCompletion: mocks.requestChatCompletion,
}));

import {
	QaAgentService,
	MAX_HISTORY_PAIRS,
	fillPrompt,
	trimHistory,
} from '../src/services/qaAgent';
import type { QaAgentConfig } from '../src/services/qaAgent';

const config: QaAgentConfig = {
	apiBaseUrl: 'https://api.test/v1',
	apiKey: 'test-key',
	model: 'gpt-test',
	temperature: 0.3,
	systemPrompt: 'Answer questions about: {selectedText}',
};

function systemMessage(content: string) {
	return { role: 'system', content } as const;
}

describe('fillPrompt', () => {
	it('replaces the {selectedText} placeholder', () => {
		expect(fillPrompt('Answer about: {selectedText}', 'hello')).toBe(
			'Answer about: hello',
		);
	});

	it('replaces every occurrence of the placeholder', () => {
		expect(
			fillPrompt('{selectedText} -> {selectedText}', 'hi'),
		).toBe('hi -> hi');
	});

	it('appends a fenced selected-text block when the placeholder is absent', () => {
		expect(fillPrompt('You are a helper.', 'hello world')).toBe(
			'You are a helper.\n\nSelected text:\n```\nhello world\n```',
		);
	});
});

describe('trimHistory', () => {
	it('keeps the system message plus the last MAX_HISTORY_PAIRS rounds', () => {
		const system = systemMessage('sys');
		const conversation = [];
		for (let i = 0; i < 10; i += 1) {
			conversation.push({ role: 'user', content: `u${i}` });
			conversation.push({ role: 'assistant', content: `a${i}` });
		}
		const messages = [system, ...conversation];

		const trimmed = trimHistory(messages);

		expect(trimmed).toHaveLength(1 + MAX_HISTORY_PAIRS * 2);
		expect(trimmed[0]).toBe(system);
		// Oldest turns are dropped.
		expect(trimmed).not.toContainEqual({ role: 'user', content: 'u0' });
		expect(trimmed).not.toContainEqual({ role: 'user', content: 'u3' });
		// Most recent turn is preserved.
		expect(trimmed.at(-1)).toEqual({ role: 'assistant', content: 'a9' });
	});

	it('leaves short histories untouched', () => {
		const messages = [
			systemMessage('sys'),
			{ role: 'user', content: 'q' },
			{ role: 'assistant', content: 'a' },
		];
		expect(trimHistory(messages)).toEqual(messages);
	});

	it('preserves the system message when there is no conversation', () => {
		const messages = [systemMessage('sys')];
		expect(trimHistory(messages)).toEqual(messages);
	});
});

describe('QaAgentService', () => {
	beforeEach(() => {
		mocks.requestChatCompletion.mockReset();
	});

	describe('reset', () => {
		it('rebuilds the system message with the injected selected text and clears history', async () => {
			const agent = new QaAgentService();
			agent.reset('old text', config);
			mocks.requestChatCompletion.mockResolvedValue('old answer');
			await agent.ask('old question', config);
			expect(agent.getHistory()).toHaveLength(2);

			agent.reset('fresh text', config);

			expect(agent.getHistory()).toEqual([]);
			// The next request must use a system message built from the new text.
			mocks.requestChatCompletion.mockResolvedValue('answer');
			await agent.ask('q', config);

			const call = mocks.requestChatCompletion.mock.calls.at(-1);
			const messages = call?.[0] as unknown[];
			expect(messages[0]).toEqual(
				systemMessage('Answer questions about: fresh text'),
			);
			expect(messages[1]).toEqual({ role: 'user', content: 'q' });
		});
	});

	describe('clear', () => {
		it('drops history but keeps the system message', async () => {
			const agent = new QaAgentService();
			agent.reset('selected', config);
			mocks.requestChatCompletion.mockResolvedValue('answer');
			await agent.ask('q1', config);

			expect(agent.getHistory()).toHaveLength(2);

			agent.clear();

			expect(agent.getHistory()).toEqual([]);
			// System message survives: the next ask still carries it.
			mocks.requestChatCompletion.mockResolvedValue('answer2');
			await agent.ask('q2', config);
			const call = mocks.requestChatCompletion.mock.calls.at(-1);
			const messages = call?.[0] as unknown[];
			expect(messages[0]).toEqual(
				systemMessage('Answer questions about: selected'),
			);
		});
	});

	describe('ask', () => {
		it('pushes the user question before the request and the assistant answer after', async () => {
			const agent = new QaAgentService();
			agent.reset('ctx', config);

			mocks.requestChatCompletion.mockResolvedValue('the answer');

			const result = await agent.ask('what is it?', config);

			expect(result).toBe('the answer');
			// The request was called with [system, user] (assistant not yet pushed).
			expect(mocks.requestChatCompletion).toHaveBeenCalledTimes(1);
			const call = mocks.requestChatCompletion.mock.calls[0];
			const messages = call?.[0] as unknown[];
			expect(messages).toEqual([
				systemMessage('Answer questions about: ctx'),
				{ role: 'user', content: 'what is it?' },
			]);
			// After resolving, history contains the full turn.
			expect(agent.getHistory()).toEqual([
				{ role: 'user', content: 'what is it?' },
				{ role: 'assistant', content: 'the answer' },
			]);
		});

		it('accumulates multi-turn history in order', async () => {
			const agent = new QaAgentService();
			agent.reset('ctx', config);

			mocks.requestChatCompletion.mockResolvedValueOnce('a1');
			await agent.ask('q1', config);
			mocks.requestChatCompletion.mockResolvedValueOnce('a2');
			await agent.ask('q2', config);

			expect(agent.getHistory()).toEqual([
				{ role: 'user', content: 'q1' },
				{ role: 'assistant', content: 'a1' },
				{ role: 'user', content: 'q2' },
				{ role: 'assistant', content: 'a2' },
			]);

			// The second request carried the first round as context.
			const secondCall = mocks.requestChatCompletion.mock.calls[1];
			const messages = secondCall?.[0] as unknown[];
			expect(messages).toEqual([
				systemMessage('Answer questions about: ctx'),
				{ role: 'user', content: 'q1' },
				{ role: 'assistant', content: 'a1' },
				{ role: 'user', content: 'q2' },
			]);
		});

		it('forwards options (signal/onChunk/maxTokens) to the shared client', async () => {
			const agent = new QaAgentService();
			agent.reset('ctx', config);
			mocks.requestChatCompletion.mockResolvedValue('answer');

			const controller = new AbortController();
			const onChunk = vi.fn();
			await agent.ask('q', config, {
				signal: controller.signal,
				onChunk,
				maxTokens: 128,
			});

			const call = mocks.requestChatCompletion.mock.calls[0];
			const options = call?.[2] as Record<string, unknown>;
			expect(options).toMatchObject({
				signal: controller.signal,
				onChunk,
				maxTokens: 128,
			});
		});

		it('passes an isolated ChatClientConfig built from the QaAgentConfig', async () => {
			const agent = new QaAgentService();
			agent.reset('ctx', config);
			mocks.requestChatCompletion.mockResolvedValue('answer');

			await agent.ask('q', config);

			const call = mocks.requestChatCompletion.mock.calls[0];
			const clientConfig = call?.[1] as Record<string, unknown>;
			expect(clientConfig).toEqual({
				apiBaseUrl: config.apiBaseUrl,
				apiKey: config.apiKey,
				model: config.model,
				temperature: config.temperature,
			});
			// The system prompt must NOT leak into the client config.
			expect(clientConfig).not.toHaveProperty('systemPrompt');
		});

		it('trims older turns once history exceeds MAX_HISTORY_PAIRS rounds', async () => {
			const agent = new QaAgentService();
			agent.reset('ctx', config);

			// Ask more than MAX_HISTORY_PAIRS rounds.
			const totalAsks = MAX_HISTORY_PAIRS + 2;
			for (let i = 0; i < totalAsks; i += 1) {
				mocks.requestChatCompletion.mockResolvedValueOnce(`a${i}`);
				await agent.ask(`q${i}`, config);
			}

			const history = agent.getHistory();
			// Trimming runs after each answer, so stored history is bounded to the
			// last MAX_HISTORY_PAIRS complete rounds.
			expect(history).toHaveLength(MAX_HISTORY_PAIRS * 2);
			// The oldest turn has been dropped by trimHistory.
			expect(history).not.toContainEqual({ role: 'user', content: 'q0' });
			// The most recent turn is retained.
			expect(history.at(-1)).toEqual({
				role: 'assistant',
				content: `a${totalAsks - 1}`,
			});

			// The final request carried system + the last MAX_HISTORY_PAIRS prior
			// rounds + the current question (no orphan assistant at the start).
			const lastCall = mocks.requestChatCompletion.mock.calls.at(-1);
			const sentMessages = lastCall?.[0] as unknown[];
			expect(sentMessages).toHaveLength(MAX_HISTORY_PAIRS * 2 + 2);
			expect(sentMessages[0]).toEqual(
				systemMessage('Answer questions about: ctx'),
			);
			// The first conversation message is always a user turn (never an
			// orphan assistant), regardless of how many rounds preceded it.
			expect((sentMessages[1] as { role: string }).role).toBe('user');
			expect(sentMessages.at(-1)).toEqual({ role: 'user', content: 'q7' });
		});
	});
});
