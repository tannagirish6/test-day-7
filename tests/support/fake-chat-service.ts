import type { ChatService, ChatTurn } from '../../src/services/chat-service';

export class FakeChatService implements ChatService {
  readonly calls: ChatTurn[][] = [];
  private responseIndex = 0;

  constructor(private readonly responses: readonly (string | Error)[] = ['A general answer.']) {}

  async answer(turns: readonly ChatTurn[]): Promise<string> {
    this.calls.push(turns.map((turn) => ({ ...turn })));

    const response = this.responses[Math.min(this.responseIndex, this.responses.length - 1)];
    this.responseIndex += 1;

    if (response instanceof Error) {
      throw response;
    }

    return response ?? '';
  }
}
