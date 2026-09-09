# Data Model: CA Buddy Chat

**Feature**: [spec.md](spec.md)

CA Buddy has no persisted data model. The following entities describe transient page state and
policy concepts only. They are cleared on `New chat`, disappear on reload, and are never sent to a
history service.

## Conversation

Represents the one active ordered exchange in the browser.

| Field | Type | Rules |
|-------|------|-------|
| `turns` | ordered list of Conversation Turn | Starts empty; preserves insertion order; contains user and assistant turns only |
| `requestState` | `idle` or `pending` or `success` or `error` | `pending` begins only after a valid non-empty submission; returns to `success` or `error` |
| `requestId` | transient number | Increments for each request and reset; identifies the active request so stale results cannot mutate a new chat |
| `errorMessage` | optional text | Present only for an unavailable answer; must be concise and must not invent tax guidance |

### Conversation Rules

- A valid submission trims only for emptiness validation; the displayed question preserves the user's
  entered text unless the product UI chooses to normalize surrounding whitespace consistently.
- The user turn is appended before the service call.
- The service is called exactly once per non-empty submission with the current ordered turns,
  including the new user turn and excluding any pending placeholder.
- While `requestState` is `pending`, a second submit is ignored or disabled.
- `New chat` sets `turns` to an empty list, clears errors, and advances `requestId`.
- A response may append an assistant turn only when its request ID still matches the active ID.
- A rejected request preserves the user turn and sets an error state; no fabricated assistant answer
  is appended.
- Reload creates a new empty Conversation because no state is persisted.

## Conversation Turn

Represents one displayed message.

| Field | Type | Rules |
|-------|------|-------|
| `id` | transient unique string | Used only for rendering stable list items; never persisted |
| `role` | `user` or `assistant` | Determines visual treatment and accessibility label |
| `content` | non-empty text | User input or returned assistant text; assistant text must be plain language |

Relationships: a Conversation owns an ordered list of Conversation Turns. A user turn may be
followed by one assistant turn or by an error state that remains outside the turn list.

## Question Scope

A policy classification used by the CA persona, not persisted as a user field.

| Category | Meaning | Required response behavior |
|----------|---------|----------------------------|
| `in-scope` | Everyday Indian GST, TDS, ITR deadlines, or audit basics | Give a concise plain-language first explanation and retain the disclaimer |
| `out-of-scope` | Anything outside those everyday topics | Explain the boundary and tell the user to consult a Chartered Accountant |
| `personal-professional-advice` | A request for a definitive individualized tax, legal, or audit conclusion | Avoid a definitive conclusion and tell the user to consult a Chartered Accountant |

The category is governed by the system prompt and verified through controlled service responses and
browser-level acceptance scenarios.

## Disclaimer

A persistent, one-line user-facing notice. It is rendered outside the turn list so it remains
visible when the conversation is empty, populated, reset, or showing an error.

## State Transitions

```text
empty/idle --valid non-empty submit--> pending
pending --assistant answer resolves--> success with assistant turn
pending --answer source rejects--> error with user turn preserved
pending --New chat--> empty/idle and invalidate request ID
success/error --New chat--> empty/idle
success/error --page reload--> new empty/idle conversation
```

The transition from an invalidated pending request to any visible state is forbidden: its eventual
result must be ignored.
