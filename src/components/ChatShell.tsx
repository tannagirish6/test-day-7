import type { FormEvent } from 'react';
import type { ChatTurn } from '../services/chat-service';
import { ChatComposer } from './ChatComposer';
import { Disclaimer } from './Disclaimer';
import { MessageList, type ChatStatus } from './MessageList';

type ChatShellProps = {
  turns: readonly ChatTurn[];
  draft: string;
  status: ChatStatus;
  errorMessage?: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNewChat: () => void;
};

export function ChatShell({
  turns,
  draft,
  status,
  errorMessage,
  onDraftChange,
  onSubmit,
  onNewChat,
}: ChatShellProps) {
  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            CA
          </div>
          <div>
            <p className="eyebrow">Everyday tax, made clearer</p>
            <h1 id="app-title">CA Buddy</h1>
          </div>
        </div>
        <button className="new-chat-button" type="button" onClick={onNewChat}>
          <span aria-hidden="true">+</span>
          New chat
        </button>
      </header>

      <main className="chat-layout" aria-labelledby="app-title">
        <section className="chat-panel" aria-labelledby="conversation-title">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Your private first pass</p>
              <h2 id="conversation-title">Conversation</h2>
            </div>
            <span className="scope-note">GST / TDS / ITR / audit</span>
          </div>
          <MessageList turns={turns} status={status} errorMessage={errorMessage} />
        </section>

        <ChatComposer
          draft={draft}
          status={status}
          onDraftChange={onDraftChange}
          onSubmit={onSubmit}
        />
        <Disclaimer />
      </main>
    </div>
  );
}
