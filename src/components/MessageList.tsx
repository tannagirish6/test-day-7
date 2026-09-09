import type { ChatTurn } from '../services/chat-service';

export type ChatStatus = 'idle' | 'pending' | 'success' | 'error';

type MessageListProps = {
  turns: readonly ChatTurn[];
  status: ChatStatus;
  errorMessage?: string;
};

export function MessageList({ turns, status, errorMessage }: MessageListProps) {
  return (
    <div className="conversation-body" role="log" aria-label="Conversation messages" aria-live="polite">
      {turns.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__kicker">A clearer first step</span>
          <p>Ask about GST, TDS, ITR deadlines, or audit basics.</p>
        </div>
      ) : (
        <div className="message-list">
          {turns.map((turn) => (
            <article className={`message message--${turn.role}`} key={turn.id}>
              <div className="message__meta">{turn.role === 'user' ? 'You' : 'CA Buddy'}</div>
              <p>{turn.content}</p>
            </article>
          ))}
        </div>
      )}

      {status === 'pending' && (
        <p className="pending-state" role="status">
          Preparing a plain-language answer...
        </p>
      )}

      {status === 'error' && errorMessage && (
        <p className="error-state" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
