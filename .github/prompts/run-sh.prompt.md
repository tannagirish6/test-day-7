---
name: run-sh
description: Create a run.sh that starts the backend and frontend, then opens the app in Chrome
model: GPT-5.6 Luna
---

Create an executable `run.sh` at the root of this project that starts the full application with a single command.

## Requirements

1. **Detect the stack first.** Inspect the repo to find the backend and frontend entry points (for example `app.py`, `main.py`, `manage.py`, `package.json`, `vite.config.*`, `index.html`). Do not assume a framework; use what is actually in the repo. Ask me only if the entry points are genuinely ambiguous.

2. **Start the backend** in the background from its directory. Activate the virtual environment if one exists (`.venv` or `venv`). Use the correct start command for the detected framework and default to its standard port. Log output to `logs/backend.log`.

3. **Start the frontend** in the background from its directory. Install dependencies only if they are missing (for example if `node_modules` does not exist). Log output to `logs/frontend.log`. If the frontend is plain static HTML with no build step, serve it with `python3 -m http.server` on port 8080 from the frontend directory.

4. **Wait until both servers are reachable** by polling their ports with `curl` (timeout of roughly 30 seconds). Print a clear error and exit non-zero if either fails to come up.

5. **Open the frontend URL in Google Chrome automatically.** Handle these cases in order:
   - `google-chrome` or `google-chrome-stable` on Linux
   - `open -a "Google Chrome"` on macOS
   - `start chrome` on Windows Git Bash
   - Fall back to `xdg-open` and print the URL if Chrome is not found.

6. **Clean shutdown.** Trap `SIGINT` and `SIGTERM` so that pressing Ctrl+C stops both backend and frontend processes. Keep the script running in the foreground after launching so Ctrl+C works.

7. **Script quality.**
   - Start with `#!/usr/bin/env bash` and `set -euo pipefail`.
   - Put ports and directory paths in variables at the top so they are easy to change.
   - Print a short status line for each step (starting backend, starting frontend, opening browser).
   - Add comments explaining each section for a beginner reading the script.

8. **After creating the file**, run `chmod +x run.sh` and tell me the exact command to launch the app.
