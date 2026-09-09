# ChatService Contract

**Feature**: [spec.md](../spec.md)

## Purpose

`ChatService` is the provider-neutral boundary between the CA Buddy conversation UI and answer
creation. The UI depends only on this contract. The production implementation adapts LangChain.js
to Google Gemini; unit tests inject a deterministic fake.

## Conceptual Interface

```ts
type ChatRole = 'user' | 'assistant';

type ChatTurn = {
  id: string;
  role: ChatRole;
  content: string;
};

interface ChatService {
  answer(turns: readonly ChatTurn[]): Promise<string>;
}
```

The final TypeScript names may follow local style, but the observable contract is fixed.

## Request Contract

- The caller invokes `answer` exactly once for each valid non-empty user submission.
- `turns` is ordered from oldest to newest and includes the new user turn.
- `turns` contains no pending placeholder, error text, or unrelated previous chat after reset.
- The service MUST NOT mutate the supplied array or its turn objects.
- The service receives no persisted identity, account, or settings data.

## Response Contract

- A fulfilled promise contains one non-empty assistant message for the current conversation.
- In-scope responses are concise, plain-language explanations about everyday Indian GST, TDS, ITR
  deadlines, or audit basics.
- Out-of-scope or personalized-professional requests contain a clear instruction to consult a
  Chartered Accountant and do not claim a definitive individualized conclusion.
- A rejected promise means no answer was produced. The UI preserves the user turn and displays a
  retry-safe error instead of fabricating an answer.

## Production Adapter

The Gemini adapter MUST:

- Read `VITE_GOOGLE_API_KEY` from build-time browser configuration.
- Use `@langchain/google-genai` with model `gemini-2.5-flash`.
- Apply the system prompt from `src/prompts/ca-system-prompt.ts`.
- Set the maximum output to 512 tokens.
- Map user and assistant turns to the provider's conversation message format in order.
- Return the provider's textual answer and surface provider/configuration failures as rejected
  promises.

The browser-visible key is client configuration by design and MUST NOT be treated as a server-side
secret. It MUST NOT be hard-coded in source or committed to the repository.

## Test Doubles and Interception

- Unit tests inject a fake service that records received turn arrays and returns controlled answers,
  delays, or failures.
- Playwright intercepts the Gemini HTTP request and returns deterministic model-shaped responses;
  it never calls the live provider or requires a real key.
- Tests verify the contract at the boundary rather than coupling the UI to LangChain internals.
