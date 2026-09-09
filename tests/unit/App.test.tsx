import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import type { ChatService, ChatTurn } from '../../src/services/chat-service';

function createService(answer = 'A general answer for your tax question.') {
  const calls: ChatTurn[][] = [];
  const service: ChatService = {
    answer: vi.fn(async (turns: readonly ChatTurn[]) => {
      calls.push(turns.map((turn) => ({ ...turn })));
      return answer;
    }),
  };

  return { calls, service };
}

describe('CA Buddy chat shell', () => {
  it('renders the required first-load surface and persistent disclaimer', () => {
    const { service } = createService();

    render(<App chatService={service} />);

    expect(screen.getByRole('heading', { name: 'CA Buddy' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Ask a question' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    expect(screen.getByText(/general information, not professional advice/i)).toBeInTheDocument();
  });

  it('shows a pending state and one answer for a valid question', async () => {
    const user = userEvent.setup();
    let resolveAnswer!: (answer: string) => void;
    const answerPromise = new Promise<string>((resolve) => {
      resolveAnswer = resolve;
    });
    const answer = vi.fn(() => answerPromise);
    const service: ChatService = { answer };

    render(<App chatService={service} />);
    const input = screen.getByRole('textbox', { name: 'Ask a question' });

    await user.type(input, 'When is my GST return due?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(answer).toHaveBeenCalledTimes(1);
    expect(screen.getByText('When is my GST return due?')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/preparing/i);

    resolveAnswer('Your due date depends on your filing frequency.');

    await waitFor(() => {
      expect(screen.getByText('Your due date depends on your filing frequency.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not call the service for an empty submission', async () => {
    const user = userEvent.setup();
    const { service } = createService();

    render(<App chatService={service} />);
    const input = screen.getByRole('textbox', { name: 'Ask a question' });

    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(service.answer).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('passes the ordered conversation to a follow-up request', async () => {
    const user = userEvent.setup();
    const calls: ChatTurn[][] = [];
    const service: ChatService = {
      answer: vi.fn(async (turns: readonly ChatTurn[]) => {
        calls.push(turns.map((turn) => ({ ...turn })));
        return calls.length === 1
          ? 'A general answer for your tax question.'
          : 'The follow-up uses the earlier question.';
      }),
    };

    render(<App chatService={service} />);
    const input = screen.getByRole('textbox', { name: 'Ask a question' });

    await user.type(input, 'What is GST composition?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('A general answer for your tax question.');

    await user.type(input, 'Does that apply to a small shop?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('The follow-up uses the earlier question.');

    expect(calls).toHaveLength(2);
    expect(calls[1].map(({ role, content }) => ({ role, content }))).toEqual([
      { role: 'user', content: 'What is GST composition?' },
      { role: 'assistant', content: 'A general answer for your tax question.' },
      { role: 'user', content: 'Does that apply to a small shop?' },
    ]);
  });

  it('shows the consult-a-CA fallback while keeping the disclaimer visible', async () => {
    const user = userEvent.setup();
    const fallback =
      'This is outside CA Buddy\'s safe scope. Please consult a Chartered Accountant for personal advice.';
    const { service } = createService(fallback);

    render(<App chatService={service} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Ask a question' }),
      'Can you decide my personal tax position?',
    );
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(fallback)).toBeInTheDocument();
    expect(screen.getByText(/general information, not professional advice/i)).toBeInTheDocument();
  });

  it('preserves the user question and shows a retry-safe error when the service fails', async () => {
    const user = userEvent.setup();
    const service: ChatService = {
      answer: vi.fn(async () => {
        throw new Error('provider unavailable');
      }),
    };

    render(<App chatService={service} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Ask a question' }),
      'When is my TDS return due?',
    );
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not prepare an answer/i);
    expect(screen.getByText('When is my TDS return due?')).toBeInTheDocument();
  });

  it('clears the conversation and sends only new turns after New chat', async () => {
    const user = userEvent.setup();
    const { calls, service } = createService('A controlled answer.');

    render(<App chatService={service} />);
    const input = screen.getByRole('textbox', { name: 'Ask a question' });
    await user.type(input, 'What is an audit?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await screen.findByText('A controlled answer.');

    await user.click(screen.getByRole('button', { name: /new chat/i }));
    expect(screen.queryByText('What is an audit?')).not.toBeInTheDocument();
    expect(screen.queryByText('A controlled answer.')).not.toBeInTheDocument();

    await user.type(input, 'What is TDS?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await screen.findAllByText('A controlled answer.');

    expect(calls).toHaveLength(2);
    expect(calls[1]).toHaveLength(1);
    expect(calls[1][0].content).toBe('What is TDS?');
  });

  it('ignores a late answer after New chat invalidates a pending request', async () => {
    const user = userEvent.setup();
    let resolveAnswer!: (answer: string) => void;
    const answer = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveAnswer = resolve;
        }),
    );
    const service: ChatService = { answer };

    render(<App chatService={service} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Ask a question' }),
      'What is GST composition?',
    );
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(screen.getByRole('status')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new chat/i }));
    resolveAnswer('This late answer must not appear.');

    await waitFor(() => {
      expect(screen.queryByText('This late answer must not appear.')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(/ask about gst, tds, itr deadlines, or audit basics/i)).toBeInTheDocument();
  });
});
