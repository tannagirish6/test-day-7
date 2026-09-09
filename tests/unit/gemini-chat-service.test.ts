import { describe, expect, it, vi } from 'vitest';
import { CA_SYSTEM_PROMPT } from '../../src/prompts/ca-system-prompt';
import {
  GeminiChatService,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_MAX_OUTPUT_TOKENS,
  GEMMA_MAX_OUTPUT_TOKENS,
  type ChatModel,
  type GeminiModelOptions,
} from '../../src/services/gemini-chat-service';
import type { ChatTurn } from '../../src/services/chat-service';

const turns: ChatTurn[] = [
  { id: 'one', role: 'user', content: 'What is GST composition?' },
  { id: 'two', role: 'assistant', content: 'It is a simplified GST scheme.' },
  { id: 'three', role: 'user', content: 'Does it suit a small shop?' },
];

describe('GeminiChatService', () => {
  it('configures Gemini and maps ordered conversation messages', async () => {
    const invoke = vi.fn(async (messages: unknown[]) => ({ content: 'A safe answer.' }));
    const model = { invoke } as unknown as ChatModel;
    const factory = vi.fn((_options: GeminiModelOptions) => model);
    const service = new GeminiChatService(
      'browser-test-key',
      undefined,
      factory,
      DEFAULT_GEMINI_MODEL,
    );

    const answer = await service.answer(turns);

    expect(answer).toBe('A safe answer.');
    expect(factory).toHaveBeenCalledWith({
      apiKey: 'browser-test-key',
      model: DEFAULT_GEMINI_MODEL,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    });
    expect(invoke).toHaveBeenCalledTimes(1);
    const [messages] = invoke.mock.calls[0] as [Array<{ content: unknown }>];
    expect(messages).toHaveLength(4);
    expect(messages.map((message) => message.content)).toEqual([
      CA_SYSTEM_PROMPT,
      'What is GST composition?',
      'It is a simplified GST scheme.',
      'Does it suit a small shop?',
    ]);
    expect(turns).toEqual([
      { id: 'one', role: 'user', content: 'What is GST composition?' },
      { id: 'two', role: 'assistant', content: 'It is a simplified GST scheme.' },
      { id: 'three', role: 'user', content: 'Does it suit a small shop?' },
    ]);
  });

  it('rejects when the browser API key is missing', async () => {
    const service = new GeminiChatService('');

    await expect(service.answer([])).rejects.toThrow(/VITE_GOOGLE_API_KEY/);
  });

  it('rejects an empty provider response', async () => {
    const model = {
      invoke: vi.fn(async () => ({ content: '   ' })),
    } as unknown as ChatModel;
    const service = new GeminiChatService('browser-test-key', model);

    await expect(service.answer(turns)).rejects.toThrow(/empty answer/i);
  });

  it('allows Gemma reasoning room while keeping the public answer concise', async () => {
    const invoke = vi.fn(async () => ({ content: [{ type: 'text', text: 'A concise answer.' }] }));
    const model = { invoke } as unknown as ChatModel;
    const factory = vi.fn((_options: GeminiModelOptions) => model);
    const service = new GeminiChatService('browser-test-key', undefined, factory, 'gemma-4-26b-a4b-it');

    await expect(service.answer(turns)).resolves.toBe('A concise answer.');
    expect(factory).toHaveBeenCalledWith({
      apiKey: 'browser-test-key',
      model: 'gemma-4-26b-a4b-it',
      maxOutputTokens: GEMMA_MAX_OUTPUT_TOKENS,
    });
  });

  it('rejects a response that contains only provider thinking blocks', async () => {
    const model = {
      invoke: vi.fn(async () => ({ content: [{ type: 'thinking', thinking: 'internal reasoning' }] })),
    } as unknown as ChatModel;
    const service = new GeminiChatService('browser-test-key', model);

    await expect(service.answer(turns)).rejects.toThrow(/empty answer/i);
  });
});
