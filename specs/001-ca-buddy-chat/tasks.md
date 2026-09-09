---

description: "Dependency-ordered implementation tasks for CA Buddy Chat"
---

# Tasks: CA Buddy Chat

**Input**: Design documents from `specs/001-ca-buddy-chat/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Implementation constraint**: The constitution requires exactly five ordered delivery tasks. Each
checklist task below maps to exactly one GitHub issue and one pull request. The task descriptions
bundle the files that must be completed together in that delivery increment; no additional
checklist tasks may be inserted without a constitution amendment.

**Test policy**: Tests are mandatory for this feature. Unit tests use an injected fake service, and
browser tests intercept the Gemini request. No automated test may call the live model.

## Phase 1: Setup and User Story 1 - First Answer (Priority: P1) [MVP]

**Goal**: Establish the Vite/React/TypeScript project and deliver the first usable chat shell. A
visitor can see the required one-screen surface, submit a non-empty question through an injected
answer seam, observe pending and completed states, and retain the disclaimer.

**Independent Test**: With a deterministic fake answer source injected, load the app, verify the
header, conversation panel, question input, `New chat` control, and disclaimer, submit a GST
question, verify one pending state and one answer, and confirm an empty submission makes no request.

- [X] T001 [US1] Create the Vite/React/TypeScript project, accessible one-screen chat shell, injected answer seam, initial unit tests, and unit-test CI in `package.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/components/ChatShell.tsx`, `src/components/ChatComposer.tsx`, `src/components/MessageList.tsx`, `src/components/Disclaimer.tsx`, `src/styles.css`, `tests/unit/App.test.tsx`, `vite.config.ts`, `vitest.config.ts`, and `.github/workflows/ci.yml`; complete as delivery issue/PR 1.

**Checkpoint**: User Story 1 has a testable shell MVP with no login, saved history, settings, backend,
or database controls.

---

## Phase 2: Foundational Service Boundary

**Purpose**: Add the provider-neutral contract and production/test adapters required by every
model-backed story. This phase is blocking because the UI must receive answers through the same
swappable boundary in production and tests.

**Independent Test**: Unit-test the production adapter with a mocked LangChain model and verify
ordered turn mapping, `gemini-2.5-flash`, 512-token output configuration, API-key configuration,
error propagation, and fake-service substitution without a live network call.

- [X] T002 Implement the swappable `ChatService` contract, LangChain/Gemini adapter, deterministic fake service, environment example, and adapter unit tests in `src/services/chat-service.ts`, `src/services/gemini-chat-service.ts`, `tests/support/fake-chat-service.ts`, `tests/unit/gemini-chat-service.test.ts`, and `.env.example`; complete as delivery issue/PR 2 before T003.

**Checkpoint**: The application has one provider-neutral answer boundary, a test double, and a
production adapter that can be wired without changing the chat UI.

---

## Phase 3: User Story 2 - Safe Contextual Guidance (Priority: P2)

**Goal**: Make follow-ups use ordered conversation memory and make the assistant safe and useful
within its declared scope. In-scope questions receive concise plain-language guidance; out-of-scope
or personal-professional questions receive the consult-a-CA fallback.

**Independent Test**: Inject controlled answers, submit an in-scope question followed by a
context-dependent question, inspect the ordered turns passed to `ChatService`, submit an out-of-scope
or personal-advice question, and verify the fallback and persistent disclaimer.

- [X] T003 [US2] Add the CA persona, topic boundaries, consult-a-CA fallback, persistent disclaimer wiring, ordered in-memory conversation state, pending/error handling, duplicate-submit protection, and stale-response invalidation in `src/prompts/ca-system-prompt.ts`, `src/App.tsx`, `src/components/ChatShell.tsx`, `src/components/ChatComposer.tsx`, `src/components/MessageList.tsx`, `src/components/Disclaimer.tsx`, and `tests/unit/App.test.tsx`; complete as delivery issue/PR 3 after T002.

**Checkpoint**: User Stories 1 and 2 are independently testable with fake answers, including
follow-up context, safety fallback, errors, and reset during a pending request.

---

## Phase 4: User Story 3 - Browser Acceptance and Clean Reset (Priority: P3)

**Goal**: Prove the complete user journey in a deployed-like browser runtime. The browser tests
must intercept Gemini, cover the required shell and answer flows, verify `New chat` and reload
privacy behavior, and run in CI without credentials.

**Independent Test**: Run Playwright against the built/previewed site, intercept the Gemini request,
complete the GST question and follow-up, verify the consult-a-CA response, reset the chat, reload the
page, and confirm that old turns are neither visible nor sent with the next question.

- [X] T004 [US3] Add intercepted Playwright coverage for the shell, first answer, pending state, follow-up context, consult-a-CA fallback, empty submission, `New chat`, reload reset, and pending-reset race, then wire the browser suite into CI in `tests/e2e/ca-buddy.spec.ts`, `playwright.config.ts`, and `.github/workflows/ci.yml`; complete as delivery issue/PR 4 after T003.

**Checkpoint**: All three user stories pass their browser-level acceptance journeys against a
model-intercepted build, with no live Gemini request or credential required.

---

## Phase 5: Polish and Cross-Cutting Deployment

**Purpose**: Publish the validated static app and enforce the project’s deployment gate. This phase
must not add product features or persistence.

**Independent Test**: Run the workflow on a pull request and verify unit tests, build, and
Playwright all complete before the workflow succeeds; run it on a successful push to the main
branch and verify GitHub Pages deploys only after those jobs pass and relative assets load.

- [X] T005 Configure GitHub Pages build/deploy permissions, relative asset output, and deployment gating so Pages runs only after unit tests, Playwright, and build succeed on a main-branch push in `.github/workflows/ci.yml`, `vite.config.ts`, and `README.md`; complete as delivery issue/PR 5 after T004.

**Checkpoint**: The acceptance walkthrough and all required CI checks gate deployment, and the
published page preserves the single-screen, ephemeral, safety-bounded behavior.

---

## Dependencies and Execution Order

The constitution requires strict sequential delivery. The five task dependencies are:

```text
T001 (setup + US1 MVP)
  -> T002 (ChatService foundation)
    -> T003 (US2 safety and memory)
      -> T004 (US3 browser acceptance)
        -> T005 (Pages deployment gate)
```

- **T001** has no prerequisite and creates the project surface and test harness.
- **T002** depends on T001 because the adapter must integrate with the existing UI seam and CI.
- **T003** depends on T002 because conversation behavior and the CA prompt use `ChatService`.
- **T004** depends on T003 because browser acceptance requires the final safety and reset behavior.
- **T005** depends on T004 because deployment is forbidden until all required checks exist and pass.

Each task is one delivery issue and one pull request. Work on later tasks MUST NOT be merged ahead
of this order, even when different files could technically be edited in parallel.

## User Story Traceability

| User story | Priority | Delivery task coverage | Independent completion point |
|------------|----------|------------------------|-------------------------------|
| US1 - Get a Plain-Language First Answer | P1 | T001 shell/test harness; T002 adapter; T003 final conversation wiring | T001 with fake answer source for MVP; T003 with production wiring |
| US2 - Continue Safely with Context | P2 | T002 service boundary; T003 persona, memory, fallback; T004 browser proof | T003 unit tests with injected fake |
| US3 - Start a Clean Conversation | P3 | T003 reset state; T004 reload/reset browser proof; T005 deployment verification | T004 against the built/previewed site |

## Parallel Execution Examples

Strict five-task governance means there are no parallel checklist tasks and no independent issue/PR
branches. The following are the permitted execution boundaries:

- **US1**: T001 is the only active delivery task; its test and shell files may be developed within
  the same issue/PR, but T002 cannot begin until T001 merges.
- **US2**: T003 is the only active story task; prompt, UI-state, and unit-test changes belong to
  the same issue/PR and must wait for T002.
- **US3**: T004 is the only active story task; Playwright specs and CI wiring belong to the same
  issue/PR and must wait for T003.
- **Cross-cutting deployment**: T005 is serialized after T004 so the deployment job can depend on
  every required check.

This deliberately gives up task-level parallelism to satisfy the constitution’s one-issue/one-PR
and ordered-five-task rule.

## Implementation Strategy

### MVP First

1. Complete T001 and run the unit suite to demonstrate the shell and first-answer journey with a
   deterministic fake.
2. Complete T002 and verify the production adapter contract without contacting live Gemini.
3. Complete T003 and re-run the unit suite for safety, context, error, and reset behavior.
4. Stop for the MVP acceptance review: US1 and US2 must pass before browser/deployment work.

### Incremental Delivery

1. Merge T001 as the shell MVP.
2. Merge T002 as the provider integration foundation.
3. Merge T003 as the safe conversational experience.
4. Merge T004 as the complete intercepted browser acceptance suite.
5. Merge T005 only after all checks pass and the Pages deployment gate is verified.

### Final Validation

Run the commands in [quickstart.md](quickstart.md):

```bash
npm ci
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Then perform the five-step acceptance walkthrough in [spec.md](spec.md), including the deployed
page and the CI-to-GitHub-Pages gate.

## Notes

- Every checklist item starts with `- [ ]`, a sequential task ID, and its required story label
  where applicable.
- Every task names exact repository file paths and maps to one delivery issue and one pull request.
- No task adds login, saved history, settings, backend services, databases, or unrelated tax topics.
- No automated test uses a live Google Gemini request or a committed API key.
