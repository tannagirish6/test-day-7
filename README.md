# CA Buddy

CA Buddy is a browser-based first-answer assistant for Indian small-business owners. It explains
everyday GST, TDS, ITR deadline, and audit-basics questions in plain language and directs users to a
Chartered Accountant when a question is outside its safe scope or needs personal advice.

The application is frontend-only. Conversation state is ephemeral, the browser calls Google Gemini
through LangChain.js, and automated tests use a fake service or intercept the model request.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_MODEL=gemma-4-26b-a4b-it` in `.env.local` when using
the live adapter locally. Never commit `.env.local` or a real key.

## Validation

```bash
npm run test:unit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

See [the feature quickstart](specs/001-ca-buddy-chat/quickstart.md) for the complete acceptance
walkthrough and deployment expectations.

## GitHub Pages deployment

The GitHub Actions workflow runs unit tests, builds the app, and runs the intercepted Playwright
suite on every push and pull request. A push to `main` deploys only after those checks pass. Add the
repository secret `VITE_GOOGLE_API_KEY` before enabling a live deployed Gemini experience; the
browser receives this value as client configuration by design.
