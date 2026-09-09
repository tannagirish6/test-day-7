# CA Buddy PRD

## One paragraph
CA Buddy is a simple, browser-based chatbot for small-business owners in India who need quick, plain-language answers to everyday GST, TDS, ITR deadline, and audit-basics questions, with a clear signal to consult a Chartered Accountant when a question is outside the assistant's safe scope or needs professional advice.

## User
The user is an Indian small-business owner who wants a fast first explanation before deciding whether to consult a Chartered Accountant.

## Happy path (this is the three-minute demo)
The user opens CA Buddy, asks "When is my GST return due?", reads the concise answer and disclaimer, asks a follow-up that depends on the first answer, then asks an out-of-scope or personal-advice question and sees the "consult a CA" fallback. The user clicks "New chat" and confirms the previous conversation is gone.

## Out of scope
Login, saved history, settings, backend services, server-side processing, databases, and questions beyond everyday Indian GST, TDS, ITR deadlines, and audit basics.

## Architecture
The browser renders the React UI and calls a swappable `ChatService`; the production implementation uses LangChain.js and Google Gemini, while tests inject a fake service or intercept the Gemini request.

- Frontend only. React + TypeScript + Vite. No backend, no server, no database. The browser calls Google Gemini directly through LangChain.js (@langchain/google-genai). The API key is read from VITE_GOOGLE_API_KEY — a local .env during development, a GitHub Actions secret when built in CI.
- Design: modern, attractive and simple. One screen: a header, one chat panel, an input, a "New chat" button, a one-line disclaimer. No login, no saved history, no settings.

## Functional requirements
- **FR-1:** On first load, the app shows one header, one chat panel, one input, a "New chat" button, and one-line disclaimer on one screen; it shows no login or settings controls.
- **FR-2:** Submitting a non-empty question adds the user message to the chat and invokes `ChatService` exactly once with the current conversation.
- **FR-3:** The chat shows a pending state while the service responds and renders the returned assistant answer in the chat panel when it completes.
- **FR-4:** A follow-up question sends the prior turns in the current conversation to `ChatService`, so the assistant can use conversation memory.
- **FR-5:** Clicking "New chat" clears all visible turns and causes the next question to start with an empty conversation; a page reload does not restore prior turns.
- **FR-6:** For in-scope questions about GST, TDS, ITR deadlines, or audit basics, the assistant response is displayed as a plain-language answer from the configured model.
- **FR-7:** For an out-of-scope question or one requiring personal professional advice, the response includes the instruction to consult a Chartered Accountant and the disclaimer remains visible.
- **FR-8:** The production service reads `VITE_GOOGLE_API_KEY` and sends the browser request through LangChain.js to Google Gemini; unit tests run with the model faked.

## The model
- **Provider:** Google Gemini through LangChain.js (`@langchain/google-genai`).
- **Model name:** `gemini-2.5-flash`.
- **System prompt:** `src/prompts/ca-system-prompt.ts`.
- **Max output tokens:** `512`.

## Quality gates
- Testing: unit tests (Vitest + Testing Library) with the model faked; end-to-end tests (Playwright) with the Gemini request intercepted; both run in GitHub Actions on every push and pull request.
- Deployment: GitHub Pages through GitHub Actions. Tests must pass before anything deploys.
- A pull request is complete only when the required unit and end-to-end checks pass and the acceptance walkthrough succeeds.

## The five tasks
- Exactly five tasks build the whole app, in this order, one GitHub issue and one pull request each:
  1. Chat UI shell, unit tests, and the CI workflow that runs them.
  2. ChatService interface; LangChain + Gemini implementation; a fake implementation for tests.
  3. The CA persona: system prompt in a file, scope rules, "consult a CA" fallback, disclaimer, conversation memory.
  4. Playwright end-to-end tests with the Gemini call intercepted, wired into CI.
  5. GitHub Pages deployment, gated on all tests passing.

## Acceptance walkthrough
1. Open the deployed page and verify the single-screen layout, disclaimer, input, and "New chat" button.
2. Ask a GST question, verify a response appears, then ask a context-dependent follow-up and verify the prior turn is used.
3. Ask an out-of-scope or personal-advice question and verify the response tells the user to consult a Chartered Accountant.
4. Click "New chat", verify the visible conversation clears, and verify a new question has no prior turns.
5. Push a change and open a pull request; verify Vitest and Playwright pass in GitHub Actions and GitHub Pages deploys only after all tests pass.