export type ChatRole = 'user' | 'assistant';

export type ChatTurn = {
  id: string;
  role: ChatRole;
  content: string;
};

export interface ChatService {
  answer(turns: readonly ChatTurn[]): Promise<string>;
}
