import type { FormEvent } from 'react';
import type { ChatStatus } from './MessageList';

type ChatComposerProps = {
  draft: string;
  status: ChatStatus;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ChatComposer({ draft, status, onDraftChange, onSubmit }: ChatComposerProps) {
  const isPending = status === 'pending';

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="question-input">
        Ask a question
      </label>
      <textarea
        id="question-input"
        name="question"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Ask a question about GST, TDS, ITR deadlines, or audit basics"
        rows={2}
        disabled={isPending}
      />
      <button className="send-button" type="submit" disabled={isPending || !draft.trim()}>
        <span aria-hidden="true">&#8599;</span>
        Send
      </button>
    </form>
  );
}
