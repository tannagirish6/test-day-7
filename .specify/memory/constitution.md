<!--
Sync Impact Report
- Version change: unversioned scaffold -> 1.0.0
- Modified principles:
	- PRINCIPLE_1_NAME / PRINCIPLE_1_DESCRIPTION -> I. Browser-First, Swappable Service Boundary
	- PRINCIPLE_2_NAME / PRINCIPLE_2_DESCRIPTION -> II. Safety-Bounded Plain-Language Guidance
	- PRINCIPLE_3_NAME / PRINCIPLE_3_DESCRIPTION -> III. Explicit Conversation State and Ephemeral Privacy
	- PRINCIPLE_4_NAME / PRINCIPLE_4_DESCRIPTION -> IV. Test-First User-Centered Behavior
	- PRINCIPLE_5_NAME / PRINCIPLE_5_DESCRIPTION -> V. Small, Reviewable Delivery
- Added sections: Product and Technical Constraints; Development Workflow; concrete Governance rules
- Removed sections: None
- Follow-up TODOs: TODO(RATIFICATION_DATE): the original adoption date is not recorded in the repository.
-->

# CA Buddy Constitution

## Core Principles

### I. Browser-First, Swappable Service Boundary
CA Buddy MUST remain a frontend-only React, TypeScript, and Vite application. The browser MUST
access model behavior through the `ChatService` contract, and provider-specific code MUST stay
behind that boundary so tests can inject a fake service. The application MUST NOT add a backend,
server-side processing, a database, login, saved history, or a settings surface. This keeps the
product deployable as a static site and makes provider changes testable without changing the UI.

### II. Safety-Bounded Plain-Language Guidance
The assistant MUST handle only everyday Indian GST, TDS, ITR deadlines, and audit-basics
questions. Answers MUST use plain language and MUST NOT present personalized legal or tax advice
as a definitive professional conclusion. For an out-of-scope question or one requiring personal
professional advice, the response MUST tell the user to consult a Chartered Accountant, while the
disclaimer remains visible. This boundary makes the product useful as a first explanation without
misrepresenting it as a substitute for professional advice.

### III. Explicit Conversation State and Ephemeral Privacy
A non-empty submission MUST add the user turn and invoke `ChatService` exactly once with the
current conversation. The UI MUST show a pending state until the response completes, append the
assistant response, and send prior turns with each follow-up. `New chat` MUST clear every visible
turn and reset the next request to an empty conversation; a page reload MUST NOT restore prior
turns. Conversation state MUST remain ephemeral and MUST NOT be persisted in browser storage or
any external history service. These rules make memory behavior observable and prevent accidental
retention of business questions.

### IV. Test-First User-Centered Behavior
User-visible behavior MUST be covered by Vitest and Testing Library unit tests with the model
faked. Browser workflows MUST be covered by Playwright end-to-end tests with the Gemini request
intercepted. The test suite MUST cover the initial shell, non-empty submission, pending and
completed states, follow-up context, the consult-a-CA fallback, and `New chat` reset behavior.
Tests are the executable definition of the service contract and the safety-critical user flows.

### V. Small, Reviewable Delivery
Changes MUST stay within the product scope and MUST be small enough to review against one user
behavior or one required delivery capability. New features MUST NOT introduce login, saved
history, settings, backend services, databases, or unrelated question domains. Every change MUST
include the narrowest automated check that proves its behavior. This preserves the deliberately
simple three-minute demo and limits the risk of scope or safety regressions.

## Product and Technical Constraints

CA Buddy MUST present one screen containing a header, one chat panel, an input, a `New chat`
button, and a one-line disclaimer on first load. The screen MUST expose no login or settings
controls.

The production model integration MUST use LangChain.js with `@langchain/google-genai`, the
`gemini-2.5-flash` model, the system prompt at `src/prompts/ca-system-prompt.ts`, and a maximum
output size of 512 tokens. The service MUST read `VITE_GOOGLE_API_KEY` from build configuration;
the key MUST NOT be hard-coded or committed to the repository. Because the request is made from
the browser, this value MUST be treated as client configuration rather than a server-side secrecy
boundary.

The application MUST use a swappable service implementation: production calls Google Gemini,
while unit tests use a fake implementation and end-to-end tests intercept the Gemini request. The
disclaimer MUST be visible independently of the conversation contents, and no browser reload or
new chat action may restore earlier turns.

## Development Workflow

The implementation MUST consist of exactly five tasks, completed in this order. Each task MUST
have exactly one GitHub issue and one pull request.

1. Build the chat UI shell, its unit tests, and the CI workflow that runs those tests.
2. Add the `ChatService` interface, the LangChain and Gemini implementation, and a fake service
	 for tests.
3. Add the CA persona, system prompt file, scope rules, consult-a-CA fallback, disclaimer, and
	 conversation memory.
4. Add Playwright end-to-end tests with the Gemini call intercepted and wire them into CI.
5. Add GitHub Pages deployment gated on all required tests passing.

GitHub Actions MUST run the required Vitest and Playwright checks on every push and pull request
once those suites exist. GitHub Pages deployment MUST run only after all required checks pass. A
pull request is complete only when its required checks pass and the acceptance walkthrough has
been performed for the affected behavior.

The acceptance walkthrough MUST verify the single-screen shell, a GST answer, a context-dependent
follow-up, the consult-a-CA fallback, `New chat` clearing, and the absence of prior turns in the
next question.

## Governance

This constitution is the governing contract for CA Buddy and supersedes conflicting project
guidance. An amendment MUST be proposed in a pull request, explain the affected principle or
constraint, update the Sync Impact Report, and pass the applicable automated checks before merge.
No implementation may silently weaken a safety boundary, persistence rule, test gate, or
deployment gate; such a change requires an explicit constitution amendment.

Constitution versions use semantic versioning:

- MAJOR increments for removing or redefining a principle or for a backward-incompatible change
	to a non-negotiable project rule.
- MINOR increments for adding a principle or materially expanding a governed section.
- PATCH increments for clarifications, wording changes, and other non-semantic refinements.

Every pull request MUST include a compliance review covering product scope, the CA safety boundary,
ephemeral conversation state, service substitution, test coverage, and deployment gating. Before
each deployment, the project MUST confirm that the acceptance walkthrough and all required CI
checks pass. Any approved exception MUST be recorded in the pull request and resolved through a
later amendment when it becomes a standing rule.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date not recorded | **Last Amended**: 2026-09-09
