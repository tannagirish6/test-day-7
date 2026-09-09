# CA Buddy Validation Quickstart

**Feature**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

This guide validates the user-visible behavior described in the specification. It assumes the
implementation files and `package.json` described by the plan have been created.

## Prerequisites

- Node.js 22 LTS and npm.
- A modern browser for manual checks.
- A Google Gemini API key only for a manual live-model session. Automated tests do not need a key.

## Install and Configure

```bash
npm ci
cp .env.example .env.local
```

Set `VITE_GOOGLE_API_KEY` in `.env.local` for a live local question. Do not commit `.env.local` or
any real key. Because this product calls Gemini directly from the browser, the key is client
configuration and must not be treated as a server-side secret.

## Run Locally

```bash
npm run dev
```

Open the printed local URL and verify:

1. The first screen has the CA Buddy header, conversation panel, question input, `New chat` action,
   and one-line disclaimer, with no login or settings controls.
2. A question such as `When is my GST return due?` appears immediately, shows a pending state, and
   eventually displays an answer.
3. A follow-up question can refer to the previous answer and receives the active conversation context.
4. An unrelated or personal-advice question directs the user to consult a Chartered Accountant.
5. `New chat` clears all turns and the next question does not use the old conversation.
6. Reloading the page does not restore the earlier turns.

## Run Automated Validation

```bash
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

For the intercepted browser suite, build with a non-secret placeholder so the production adapter
constructs a request that Playwright can intercept:

```bash
VITE_GOOGLE_API_KEY=playwright-test-key npm run build
npm run test:e2e
```

Unit tests use an injected fake service and verify exact-once submission, pending and error states,
follow-up turn ordering, consult-a-CA behavior, and reset during a pending request. Playwright runs
against the built/previewed site, intercepts the Gemini request, and verifies the shell, first answer,
follow-up, fallback, reset, and reload flows without contacting the live model.

## CI Expectations

The GitHub Actions workflow runs the unit suite and production build on every push and pull request,
then runs Playwright with the Gemini request intercepted. A Pages deployment is allowed only for a
successful push to the main branch after all validation jobs pass.

## Acceptance Walkthrough

Use the five-step walkthrough in [spec.md](spec.md#success-criteria) after the automated checks pass.
The result is acceptable only when all required controls, safety wording, context behavior, reset
behavior, and deployment gates are observable.
