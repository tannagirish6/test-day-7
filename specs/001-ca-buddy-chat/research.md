# Research: CA Buddy Chat

**Feature**: [spec.md](spec.md)
**Date**: 2026-09-09

## Decision 1: Use one static Vite frontend with an in-memory conversation

- **Decision**: Build one React and TypeScript single-page application served as static assets. Keep
  conversation state in the page process only; do not add routes, a backend, a database, browser
  storage, or a server-side session.
- **Rationale**: This is the smallest architecture that satisfies the one-screen demo, GitHub
  Pages deployment, ephemeral privacy requirement, and constitution Principle I. The feature has
  one active conversation and no account or history workflow.
- **Alternatives considered**: A backend or serverless proxy would better protect a model key but
  violates the frontend-only PRD and adds an out-of-scope service. Browser storage would make
  reloads convenient but violates the explicit no-history and no-restoration requirements.

## Decision 2: Keep model access behind a `ChatService` contract

- **Decision**: Define a small service boundary that accepts the ordered active conversation and
  resolves to one assistant answer. The UI receives the service through dependency injection so
  tests can use a deterministic fake without changing user-visible behavior.
- **Rationale**: The boundary makes the exact-once submission rule, follow-up context, failure
  handling, and provider substitution directly testable. It also keeps provider-specific message
  conversion out of the UI.
- **Alternatives considered**: Calling Gemini from React event handlers would couple rendering to
  the provider and make unit tests dependent on network behavior. A broader repository or API
  abstraction would add complexity without another consumer.

## Decision 3: Use LangChain.js and Google Gemini with the specified model settings

- **Decision**: The production adapter uses `ChatGoogleGenerativeAI` from
  `@langchain/google-genai`, model `gemini-2.5-flash`, the CA system prompt, and a 512-token
  maximum output. It reads `import.meta.env.VITE_GOOGLE_API_KEY` and reports a configuration error
  through the normal UI error path when the key is unavailable.
- **Rationale**: These choices are fixed by the PRD and preserve a replaceable provider adapter.
  The key is intentionally client configuration because the product explicitly calls Gemini from
  the browser; it is not treated as a server-side secret.
- **Alternatives considered**: A raw Google SDK request would bypass the required LangChain
  integration. A server-side key proxy would conflict with the frontend-only architecture.

## Decision 4: Enforce the CA persona in a versioned system-prompt module

- **Decision**: Store the complete persona and scope policy in
  `src/prompts/ca-system-prompt.ts`. The prompt requires plain language for GST, TDS, ITR
  deadlines, and audit basics; refuses unrelated or individualized professional conclusions; and
  explicitly tells the user to consult a Chartered Accountant when the question is unsafe or out
  of scope.
- **Rationale**: A named prompt file is required by the PRD and keeps the safety policy reviewable
  independently from UI code. The user-facing fallback is tested through the service fake and the
  intercepted model response.
- **Alternatives considered**: A client keyword classifier would be brittle for natural-language
  questions and could create false confidence. A second policy service would violate the small
  static architecture. The prompt is therefore the model policy boundary, with tests asserting the
  required observable fallback text.

## Decision 5: Handle pending, errors, and reset races with explicit request identity

- **Decision**: The UI keeps separate conversation turns and request state (`idle`, `pending`,
  `success`, or `error`). Each request receives a monotonically increasing identity. `New chat`
  clears turns and advances the identity; a late result from an invalidated request is ignored.
  While pending, duplicate submission is disabled or ignored.
- **Rationale**: This directly satisfies the pending, exactly-once, error, and reset-during-pending
  requirements without canceling provider promises. It prevents an old answer from reappearing in a
  newly reset conversation.
- **Alternatives considered**: AbortController cannot be assumed to cancel the provider work and
  still needs stale-result protection. A global store would be unnecessary for one screen and
  risks accidental persistence.

## Decision 6: Test behavior at two boundaries

- **Decision**: Use Vitest with jsdom, Testing Library, and an injected fake service for component
  and state behavior. Use Playwright against the built/previewed site and intercept the Gemini
  request at the browser boundary for end-to-end flows. No automated test calls the live model.
- **Rationale**: Unit tests prove exact service invocation, conversation memory, pending/error
  states, and reset race behavior quickly. Playwright proves the deployed-like shell, accessible
  controls, browser request path, safety fallback, and clean reset without credentials.
- **Alternatives considered**: Live-model tests are slow, nondeterministic, and could expose a key.
  Component-only tests would not prove the browser build or network interception path.

## Decision 7: Gate GitHub Pages deployment in the same workflow as all tests

- **Decision**: Use one GitHub Actions workflow with unit-test, build, and Playwright jobs. A Pages
  deployment job runs only for a push to the main branch and declares all test/build jobs as
  prerequisites. Configure Vite for relative assets because the site may be served below the
  repository path.
- **Rationale**: A single workflow gives the deployment job a direct `needs` dependency on every
  required check, satisfying the constitution and PRD. Pull requests run validation but do not
  deploy. Relative assets keep the no-route single-screen app usable on GitHub Pages project URLs.
- **Alternatives considered**: A separate deployment workflow would need duplicated tests or a
  reusable-workflow dependency to prove gating. Deploying on pull requests would be unsafe and is
  not required by the product.

## Resolved Technical Unknowns

- The repository is currently a planning-only workspace, so the plan establishes the source,
  test, configuration, and workflow layout rather than adapting existing code.
- No external API or persisted data schema is needed; the only explicit integration is the
  browser-to-Gemini adapter documented in [contracts/chat-service.md](contracts/chat-service.md).
- No clarification markers remain in the plan. All technology choices are fixed by the PRD or by
  the constitution's static, testable, ephemeral architecture.
