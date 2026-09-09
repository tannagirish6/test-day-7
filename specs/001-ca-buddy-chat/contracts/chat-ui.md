# Chat UI Contract

**Feature**: [spec.md](../spec.md)

The UI contract describes the stable user-facing surface that unit and browser tests may rely on.
It is an accessibility contract, not a requirement to expose implementation-specific DOM structure.

## Required Surface

- One page header identifying **CA Buddy**.
- One main chat panel with an accessible name such as **Conversation**.
- One text input with an accessible label such as **Ask a question**.
- One submit control with an accessible name such as **Send**.
- One `New chat` button.
- One persistent, visible disclaimer explaining that answers are a first explanation and may require
  Chartered Accountant advice.
- No login, saved-history, or settings controls.

## Interaction States

- Empty state: the panel communicates that the user can ask a GST, TDS, ITR deadline, or audit-basics
  question.
- Pending state: a visible status communicates that an answer is being prepared; duplicate submits
  are disabled or ignored.
- Answered state: user and assistant turns are distinguishable and readable in order.
- Error state: the submitted user question remains visible and a concise retry-safe error is shown.
- Reset state: `New chat` removes all prior turns and returns the panel to the empty state.

## Accessibility and Layout Invariants

- Controls are reachable by keyboard and have stable accessible names.
- The input, `New chat` control, and disclaimer remain available on the one-screen layout after the
  conversation grows.
- The pending indicator and assistant response are exposed as readable text, not only color or
  animation.
- The layout remains usable on desktop and mobile widths without overlapping text or controls.
