import { useRef, useState, type FormEvent } from 'react';
import type { ChatService, ChatTurn } from './services/chat-service';
import { GeminiChatService } from './services/gemini-chat-service';
import { ChatShell } from './components/ChatShell';
import type { ChatStatus } from './components/MessageList';

const ANSWER_ERROR_MESSAGE =
  'We could not prepare an answer right now. Please check your connection and try again.';

let nextTurnId = 0;

function createTurnId() {
  nextTurnId += 1;
  return `turn-${nextTurnId}`;
}

type AppProps = {
  chatService?: ChatService;
};

export default function App({ chatService }: AppProps) {
  const serviceRef = useRef<ChatService | null>(null);
  const requestIdRef = useRef(0);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();

  if (serviceRef.current === null) {
    serviceRef.current = chatService ?? new GeminiChatService();
  }

  const service = serviceRef.current;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (status === 'pending' || !draft.trim()) {
      return;
    }

    const userTurn: ChatTurn = {
      id: createTurnId(),
      role: 'user',
      content: draft,
    };
    const conversation = [...turns, userTurn];
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setTurns(conversation);
    setDraft('');
    setErrorMessage(undefined);
    setStatus('pending');

    try {
      const answer = await service.answer(conversation);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const trimmedAnswer = answer.trim();
      if (!trimmedAnswer) {
        throw new Error('The answer source returned an empty response.');
      }

      setTurns((currentTurns) => [
        ...currentTurns,
        { id: createTurnId(), role: 'assistant', content: trimmedAnswer },
      ]);
      setStatus('success');
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setErrorMessage(ANSWER_ERROR_MESSAGE);
      setStatus('error');
    }
  };

  const handleNewChat = () => {
    requestIdRef.current += 1;
    setTurns([]);
    setDraft('');
    setErrorMessage(undefined);
    setStatus('idle');
  };

  return (
    <ChatShell
      turns={turns}
      draft={draft}
      status={status}
      errorMessage={errorMessage}
      onDraftChange={setDraft}
      onSubmit={handleSubmit}
      onNewChat={handleNewChat}
    />
  );
}
