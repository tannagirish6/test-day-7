# Feature Specification: CA Buddy Chat

**Feature Branch**: `001-ca-buddy-chat`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: Create CA Buddy, a browser-based first-answer assistant for Indian small-business owners with safe scope boundaries, conversation follow-up, and a clean reset flow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get a Plain-Language First Answer (Priority: P1)

An Indian small-business owner opens CA Buddy, asks an everyday question about GST, TDS, an ITR deadline, or audit basics, and receives a concise plain-language explanation with a visible reminder that professional advice may be needed.

**Why this priority**: A fast, understandable first explanation is the core value of CA Buddy and the entry point for every other journey.

**Independent Test**: Open a fresh session, submit a representative GST question, and verify that the question appears, a response is shown after a pending state, and the disclaimer remains visible.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no active conversation, **When** the page opens, **Then** the visitor sees one header, one chat panel, one question input, a `New chat` action, and a one-line disclaimer without login or settings controls.
2. **Given** the visitor enters a non-empty in-scope question, **When** the visitor submits it, **Then** the question appears in the conversation, the interface indicates that an answer is pending, and the returned plain-language answer appears in the chat panel.
3. **Given** the visitor submits only spaces or an empty value, **When** the visitor attempts to submit, **Then** no conversation turn is added and no answer request is made.

---

### User Story 2 - Continue Safely with Context (Priority: P2)

The owner asks a follow-up that depends on the first answer and expects CA Buddy to understand the current conversation. When the owner asks for an out-of-scope answer or individualized professional advice, CA Buddy clearly directs the owner to consult a Chartered Accountant.

**Why this priority**: Follow-up context makes the assistant useful beyond a one-off lookup, while the safety fallback prevents the product from being mistaken for a personal professional advisor.

**Independent Test**: Submit an in-scope question, submit a context-dependent follow-up, then submit an out-of-scope or personal-advice question and verify the response behavior for each step.

**Acceptance Scenarios**:

1. **Given** an answered first question, **When** the owner submits a follow-up that refers to it, **Then** the assistant receives the prior conversation and returns an answer that uses that context.
2. **Given** the owner asks a question outside everyday GST, TDS, ITR deadlines, or audit basics, **When** the assistant responds, **Then** the response tells the owner to consult a Chartered Accountant and the disclaimer is still visible.
3. **Given** the owner asks for a personal tax or legal conclusion, **When** the assistant responds, **Then** it avoids presenting a definitive individualized conclusion and directs the owner to a Chartered Accountant.

---

### User Story 3 - Start a Clean Conversation (Priority: P3)

The owner finishes a conversation and starts a new one without seeing or sending the earlier questions and answers.

**Why this priority**: A reliable reset supports privacy expectations and ensures that a new question is not accidentally answered using the wrong business context.

**Independent Test**: Complete one conversation, activate `New chat`, and submit a new question; verify that the old turns are gone and the new question begins with no prior context.

**Acceptance Scenarios**:

1. **Given** a conversation with visible questions and answers, **When** the owner selects `New chat`, **Then** every visible turn is cleared and the empty chat state is shown.
2. **Given** the owner has selected `New chat`, **When** the owner submits a new question, **Then** the assistant receives only the new conversation and the old turns do not affect the answer.
3. **Given** the owner reloads the page after a conversation, **When** the page finishes loading, **Then** none of the earlier turns are restored.

### Edge Cases

- Empty or whitespace-only submissions are ignored without creating a turn or requesting an answer.
- A repeated submit while an answer is pending MUST NOT create duplicate requests or duplicate user turns.
- If the answer source is unavailable, the submitted question remains visible and the interface shows a clear retry-safe error rather than inventing an answer.
- If `New chat` is selected while an answer is pending, the pending result MUST NOT repopulate the new conversation after the reset.
- A long returned answer remains readable within the chat panel and does not hide the input, disclaimer, or `New chat` action.
- Questions outside the defined scope always receive the consult-a-CA direction, even when they are phrased as urgent or personal requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The first-load experience MUST show one header, one chat panel, one question input, a `New chat` action, and a one-line disclaimer on one screen.
- **FR-002**: The first-load experience MUST expose no login, saved-history, or settings controls.
- **FR-003**: The system MUST accept and display every non-empty submitted question as a user turn.
- **FR-004**: The system MUST request exactly one assistant answer for each non-empty submission and MUST NOT request an answer for an empty or whitespace-only submission.
- **FR-005**: The conversation MUST show a pending state while an answer is being produced and MUST display the returned assistant answer when it completes.
- **FR-006**: Each follow-up submission MUST include the ordered prior turns from the active conversation so the assistant can use the conversation context.
- **FR-007**: For everyday Indian GST, TDS, ITR deadline, and audit-basics questions, the assistant MUST provide a concise plain-language explanation.
- **FR-008**: For an out-of-scope question or one requiring personal professional advice, the response MUST tell the user to consult a Chartered Accountant and MUST NOT present a definitive individualized professional conclusion.
- **FR-009**: The disclaimer MUST remain visible independently of the conversation contents, including after an answer and after a reset.
- **FR-010**: Selecting `New chat` MUST clear all visible turns and reset the next submission to an empty conversation.
- **FR-011**: Reloading the page MUST NOT restore any prior conversation turns.
- **FR-012**: Conversation turns MUST NOT be saved as user history or persisted for later retrieval.
- **FR-013**: If an answer cannot be produced, the system MUST preserve the submitted question and show a non-deceptive error or retry message instead of fabricating an answer.
- **FR-014**: Resetting during a pending answer MUST prevent the pending result from appearing in the newly reset conversation.
- **FR-015**: The answer source MUST be replaceable for automated testing without changing the user-visible conversation behavior.

### Key Entities *(include if feature involves data)*

- **Conversation**: The current ordered collection of questions and answers, held only for the active page session.
- **Conversation Turn**: One user question or one assistant answer, including its speaker and displayed text.
- **Question Scope**: The classification of a question as in-scope, out-of-scope, or requiring personal professional advice.
- **Disclaimer**: The persistent notice that answers are a first explanation and may require Chartered Accountant advice.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of acceptance walkthroughs, a first-time visitor can identify the question input, `New chat` action, chat panel, and disclaimer without navigating to another page.
- **SC-002**: A target user can complete the GST question, context-dependent follow-up, consult-a-CA fallback, and clean-reset walkthrough within three minutes.
- **SC-003**: In 100% of valid submission tests, the submitted question is visible, one pending state is shown, and one corresponding answer or clear retry-safe error is displayed.
- **SC-004**: In 100% of follow-up acceptance scenarios, the returned answer demonstrates use of the earlier conversation rather than treating the follow-up as an unrelated first question.
- **SC-005**: In 100% of out-of-scope and personal-advice acceptance scenarios, the response directs the user to consult a Chartered Accountant and the disclaimer remains visible.
- **SC-006**: In 100% of reset and reload acceptance scenarios, no prior conversation turn is visible or sent with the next question.
- **SC-007**: Zero empty submissions create visible turns or answer requests, and zero unavailable-answer scenarios display fabricated professional guidance.
- **SC-008**: At least 4 of 5 target-user reviewers can complete the primary walkthrough without outside instructions and describe when they should consult a Chartered Accountant.

## Assumptions

- The primary user is an Indian small-business owner seeking a quick first explanation, not a replacement for a Chartered Accountant.
- Users have a modern browser and an internet connection while using the assistant.
- The assistant answer source is configured before deployment and can be substituted with a predictable test source during automated checks.
- CA Buddy has one active conversation at a time and does not provide accounts, saved history, settings, or cross-device continuity in the first release.
- Tax rules and deadlines can change; the visible disclaimer and consult-a-CA fallback remain necessary even when an answer appears clear.
- Error handling uses a concise, user-friendly retry message when the answer source is unavailable.
