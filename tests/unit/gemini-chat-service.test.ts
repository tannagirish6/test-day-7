import { describe, expect, it, vi } from 'vitest';
import { CA_SYSTEM_PROMPT } from '../../src/prompts/ca-system-prompt';
import {
  GeminiChatService,
  DEFAULT_GEMINI_MODEL,
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
    const service = new GeminiChatService('browser-test-key', undefined, factory);

    const answer = await service.answer(turns);

    expect(answer).toBe('A safe answer.');
    expect(factory).toHaveBeenCalledWith({
      apiKey: 'browser-test-key',
      model: import.meta.env.VITE_GOOGLE_MODEL || DEFAULT_GEMINI_MODEL,
      maxOutputTokens: 512,
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
});
