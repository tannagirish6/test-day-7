# Implementation Plan: CA Buddy Chat

**Branch**: `001-ca-buddy-chat` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-ca-buddy-chat/spec.md`

## Summary

Build a single-screen static web application that gives Indian small-business owners a
plain-language first answer for everyday GST, TDS, ITR deadline, and audit-basics questions.
The UI owns one ephemeral conversation and delegates answer generation through a `ChatService`
contract. Production uses LangChain.js with Google Gemini; unit tests inject a fake service and
Playwright intercepts the browser model request. The same CI workflow runs unit tests, builds the
site, runs browser tests, and deploys GitHub Pages only after all required checks pass on the main
branch.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19.x; Node.js 22 LTS for local development and CI

**Primary Dependencies**: Vite 7.x, `@vitejs/plugin-react`, `@langchain/google-genai`,
`@langchain/core`, Vitest, Testing Library, Playwright, and `@testing-library/user-event`

**Storage**: None. Conversation state is held in memory for the active page session and is never
written to browser storage, a database, or a server.

**Testing**: Vitest with jsdom, Testing Library, and injected fake `ChatService`; Playwright with
the Gemini network request intercepted; production build validation with Vite

**Target Platform**: Modern desktop and mobile browsers served as a static GitHub Pages site;
the local development and CI runtime is Node.js 22 LTS

**Project Type**: Frontend-only single-page web application

**Performance Goals**: Render the initial shell immediately on a normal modern browser, show the
pending state in the same interaction that submits a valid question, and keep local reset and
input interactions responsive without waiting for the model. The model response has no fixed
latency SLA; the pending state remains visible until completion or failure.

**Constraints**: One screen and one active conversation; no login, history, settings, backend,
database, or server-side processing; direct browser access to Gemini through the configured
`VITE_GOOGLE_API_KEY`; maximum model output of 512 tokens; only the four defined everyday tax and
audit topic areas are in scope; the disclaimer and consult-a-CA boundary are always preserved

**Scale/Scope**: A small static demo for one active user conversation per browser page; one
production model adapter; one fake adapter for unit tests; one Playwright workflow covering the
three user journeys and critical edge cases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Browser-First, Swappable Service Boundary**: PASS. The design is a Vite static frontend,
  keeps Gemini behind `ChatService`, and has no backend or persistence.
- **II. Safety-Bounded Plain-Language Guidance**: PASS. The system prompt and response contract
  limit the topic scope, require plain language, and require a consult-a-CA fallback for unsafe or
  out-of-scope requests.
- **III. Explicit Conversation State and Ephemeral Privacy**: PASS. The UI owns ordered in-memory
  turns, sends the active context once per valid submission, invalidates stale responses on reset,
  and never restores turns after reload.
- **IV. Test-First User-Centered Behavior**: PASS. Vitest/Testing Library cover injected service
  behavior and Playwright covers the intercepted browser workflow, including safety and reset.
- **V. Small, Reviewable Delivery**: PASS. The structure is one frontend project with five
  ordered delivery tasks and no unrelated product surfaces.

No constitution violations require complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-ca-buddy-chat/
├── plan.md              # This implementation plan
├── research.md          # Resolved technology and integration decisions
├── data-model.md        # Transient conversation and request state design
├── quickstart.md        # Local and CI validation guide
├── contracts/
│   ├── chat-service.md  # Service boundary and model adapter contract
│   └── chat-ui.md       # Accessible user-facing interaction contract
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Generated later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── main.tsx
├── styles.css
├── components/
│   ├── ChatComposer.tsx
│   ├── ChatShell.tsx
│   ├── Disclaimer.tsx
│   └── MessageList.tsx
├── prompts/
│   └── ca-system-prompt.ts
└── services/
    ├── chat-service.ts
    └── gemini-chat-service.ts

tests/
├── e2e/
│   └── ca-buddy.spec.ts
├── support/
│   └── fake-chat-service.ts
└── unit/
    ├── App.test.tsx
    └── gemini-chat-service.test.ts

index.html
package.json
playwright.config.ts
vite.config.ts
vitest.config.ts
.env.example
.github/
└── workflows/
    └── ci.yml
```

**Structure Decision**: Use one frontend project at the repository root. React components own
the screen, `services/` owns the swappable answer boundary, `prompts/` owns the CA persona, and
tests are split by runtime: injected-service unit tests and intercepted-browser end-to-end tests.
There is intentionally no `backend/`, persistence layer, route directory, or server package.

## Complexity Tracking

No violations. The design uses one application, one service boundary, and transient state to meet
the product and constitution constraints.

## Post-Design Constitution Check

The Phase 1 design preserves every pre-research gate:

- **Browser-first boundary**: PASS. The source tree contains only a static frontend and provider
  adapter; no backend, database, login, or persistence path was introduced.
- **Safety-bounded guidance**: PASS. The prompt, service response contract, persistent disclaimer,
  and consult-a-CA behavior are explicit and testable.
- **Ephemeral conversation state**: PASS. The data model clears turns on reset/reload and rejects
  stale pending results through request identity.
- **Test-first behavior**: PASS. Unit, browser, build, and CI validation paths are documented and
  use fake or intercepted model behavior rather than live requests.
- **Small delivery**: PASS. The design remains one project with the five ordered delivery tasks
  and no new product surface.

**Post-design gate result**: PASS. No constitution amendment or complexity exception is required.
