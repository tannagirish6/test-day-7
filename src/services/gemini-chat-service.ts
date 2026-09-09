import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { CA_SYSTEM_PROMPT } from '../prompts/ca-system-prompt';
import type { ChatService, ChatTurn } from './chat-service';

export type ChatModel = Pick<ChatGoogleGenerativeAI, 'invoke'>;

export type GeminiModelOptions = {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
};

export type GeminiModelFactory = (options: GeminiModelOptions) => ChatModel;

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function extractText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (part && typeof part === 'object' && 'text' in part) {
        const text = part.text;
        return typeof text === 'string' ? text : '';
      }

      return '';
    })
    .join('');
}

export class GeminiChatService implements ChatService {
  private readonly model?: ChatModel;
  private readonly configurationError?: Error;

  constructor(
    apiKey: string | undefined = import.meta.env.VITE_GOOGLE_API_KEY,
    model?: ChatModel,
    modelFactory: GeminiModelFactory = (options) => new ChatGoogleGenerativeAI(options),
    modelName: string = import.meta.env.VITE_GOOGLE_MODEL || DEFAULT_GEMINI_MODEL,
  ) {
    if (!apiKey && !model) {
      this.configurationError = new Error(
        'VITE_GOOGLE_API_KEY is not configured for the Gemini service.',
      );
      return;
    }

    this.model =
      model ??
      modelFactory({
        apiKey: apiKey as string,
        model: modelName,
        maxOutputTokens: 512,
      });
  }

  async answer(turns: readonly ChatTurn[]): Promise<string> {
    if (this.configurationError) {
      throw this.configurationError;
    }

    if (!this.model) {
      throw new Error('The Gemini model is unavailable.');
    }

    const messages = [
      new SystemMessage(CA_SYSTEM_PROMPT),
      ...turns.map((turn) =>
        turn.role === 'user'
          ? new HumanMessage(turn.content)
          : new AIMessage(turn.content),
      ),
    ];

    const response = await this.model.invoke(messages);
    const answer = extractText(response.content).trim();

    if (!answer) {
      throw new Error('The Gemini service returned an empty answer.');
    }

    return answer;
  }
}
