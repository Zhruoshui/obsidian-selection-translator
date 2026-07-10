import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	requestChatCompletion: vi.fn(),
	execute: vi.fn(),
}));

vi.mock('../src/services/openAIChatClient', () => ({
	requestChatCompletion: mocks.requestChatCompletion,
}));

vi.mock('../src/services/qa/tools', async () => {
	const actual = await vi.importActual<
		typeof import('../src/services/qa/tools')
	>('../src/services/qa/tools');
	return {
		...actual,
		getToolByName: (name: string) => {
			if (name === 'web_search') {
				return {
					name: 'web_search',
					description: '',
					parameters: {},
					execute: mocks.execute,
				};
			}
			return undefined;
		},
		toChatTools: () => [
			{
				type: 'function',
				function: { name: 'web_search', description: '', parameters: {} },
			},
		],
	};
});

import { AgentLoop, type AgentLoopConfig } from '../src/services/qa/agentLoop';
import type { ChatMessage } from '../src/services/openAIChatClient';

function makeConfig(overrides: Partial<AgentLoopConfig> = {}): AgentLoopConfig {
	return {
		chat: {
			apiBaseUrl: 'https://api.test/v1',
			apiKey: 'k',
			model: 'gpt-test',
			temperature: 0.2,
		},
		webSearch: {
			enabled: true,
			settings: {
				search: { provider: 'duckduckgo', apiKey: '' },
				searchResultLimit: 3,
				fetchMaxChars: 1000,
			},
		},
		maxIterations: 3,
		...overrides,
	};
}

const seed: ChatMessage[] = [
	{ role: 'system', content: 'sys' },
	{ role: 'user', content: 'q' },
];

beforeEach(() => {
	mocks.requestChatCompletion.mockReset();
	mocks.execute.mockReset();
});

describe('AgentLoop.run', () => {
	it('degenerates to a single streaming chat when web search is disabled', async () => {
		mocks.requestChatCompletion.mockImplementation(async (_msgs, _cfg, opts) => {
			opts.onChunk?.('hello');
			return { content: 'hello', toolCalls: [], finishReason: 'stop' };
		});

		const chunks: string[] = [];
		const result = await new AgentLoop().run(
			seed,
			makeConfig({ webSearch: { enabled: false, settings: makeConfig().webSearch.settings } }),
			{ onAnswerChunk: (c) => chunks.push(c) },
		);

		expect(result.answer).toBe('hello');
		expect(result.iterations).toBe(0);
		expect(chunks).toEqual(['hello']);
		// Only one call, and it MUST NOT contain tools/tool_choice.
		expect(mocks.requestChatCompletion).toHaveBeenCalledTimes(1);
		const opts = mocks.requestChatCompletion.mock.calls[0]?.[2];
		expect(opts?.tools).toBeUndefined();
		expect(opts?.toolChoice).toBeUndefined();
	});

	it('runs a tool call round then returns the model final content', async () => {
		mocks.requestChatCompletion
			.mockResolvedValueOnce({
				content: '',
				toolCalls: [
					{
						id: 'call_1',
						type: 'function',
						function: { name: 'web_search', arguments: '{"query":"foo"}' },
					},
				],
				finishReason: 'tool_calls',
			})
			.mockResolvedValueOnce({
				content: 'final answer',
				toolCalls: [],
				finishReason: 'stop',
			});
		mocks.execute.mockResolvedValueOnce('search results text');

		const activity: Array<[string, string]> = [];
		const chunks: string[] = [];
		const result = await new AgentLoop().run(seed, makeConfig(), {
			onAnswerChunk: (c) => chunks.push(c),
			onToolActivity: (kind, detail) => activity.push([kind, detail]),
		});

		expect(result.answer).toBe('final answer');
		expect(result.iterations).toBe(1);
		expect(chunks).toEqual(['final answer']);
		expect(mocks.execute).toHaveBeenCalledTimes(1);
		// Second (final) call is the model answering with tool result in transcript.
		const secondArgs = mocks.requestChatCompletion.mock.calls[1]?.[0] as ChatMessage[];
		expect(secondArgs).toContainEqual({
			role: 'tool',
			tool_call_id: 'call_1',
			content: 'search results text',
		});
	});

	it('forces a final streamed answer without tools when maxIterations is reached', async () => {
		mocks.requestChatCompletion.mockImplementation(async (_msgs, _cfg, opts) => {
			// Every call that still passes `tools` gets another tool request.
			if (opts.tools) {
				return {
					content: '',
					toolCalls: [
						{
							id: `call_${mocks.requestChatCompletion.mock.calls.length}`,
							type: 'function',
							function: { name: 'web_search', arguments: '{"query":"x"}' },
						},
					],
					finishReason: 'tool_calls',
				};
			}
			// Final round: no tools → force answer.
			opts.onChunk?.('forced final');
			return { content: 'forced final', toolCalls: [], finishReason: 'stop' };
		});
		mocks.execute.mockResolvedValue('search result');

		const chunks: string[] = [];
		const result = await new AgentLoop().run(seed, makeConfig({ maxIterations: 2 }), {
			onAnswerChunk: (c) => chunks.push(c),
		});

		expect(result.answer).toBe('forced final');
		expect(chunks).toEqual(['forced final']);
		expect(result.iterations).toBe(2);
		// 2 non-streaming + 1 streaming = 3 calls.
		expect(mocks.requestChatCompletion).toHaveBeenCalledTimes(3);
		const lastCallOpts = mocks.requestChatCompletion.mock.calls[2]?.[2];
		expect(lastCallOpts?.tools).toBeUndefined();
	});

	it('surfaces unknown tools as a [tool error] to the model', async () => {
		mocks.requestChatCompletion
			.mockResolvedValueOnce({
				content: '',
				toolCalls: [
					{
						id: 'call_unknown',
						type: 'function',
						function: { name: 'bogus_tool', arguments: '{}' },
					},
				],
				finishReason: 'tool_calls',
			})
			.mockResolvedValueOnce({
				content: 'recovered',
				toolCalls: [],
				finishReason: 'stop',
			});

		const result = await new AgentLoop().run(seed, makeConfig());

		expect(result.answer).toBe('recovered');
		const toolMessage = result.transcript.find((m) => m.role === 'tool');
		expect(toolMessage?.content).toMatch(/\[tool error\].*bogus_tool/);
	});

	it('aborts immediately when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			new AgentLoop().run(seed, makeConfig(), { signal: controller.signal }),
		).rejects.toThrow(/aborted|cancelled|中止/i);
		expect(mocks.requestChatCompletion).not.toHaveBeenCalled();
	});
});
