# Voice Cleanup And Submit Flow Design

Design reference for the next MVP step.

Updated: 2026-04-09

## 1. Goal

Adjust the current Task0 voice MVP so that transcript cleanup and semantic parsing become two explicitly separate steps:

- recording produces transcript text
- ending recording triggers cleanup automatically
- submitting the cleaned text triggers parse
- parse continues to produce structured field updates

This keeps the current MVP scope focused on `UserTask_0 + HANDLE` while making the text path more controllable and easier to inspect.

## 2. Product Decision Summary

The target interaction is:

1. user clicks `开始录音`
2. frontend displays live ASR text only
3. user clicks `结束录音`
4. frontend sends the final transcript to backend cleanup
5. backend returns cleaned text
6. frontend replaces the current text with the cleaned text
7. user can click `Reset` to clear the current text only
8. user can click `Submit` to parse the current cleaned text
9. parse success creates one conversation history record and enters the existing confirmation flow

Important constraints:

- cleanup and parse are independent features
- cleanup is model-assisted wording polish, not semantic extraction
- parse must consume the cleaned text
- submit must not run when the current text is empty after trimming
- conversation history is generated on parse success, not on cleanup

## 3. In Scope

- keep current `开始录音 / 结束录音` recording controls
- add separate `Reset` and `Submit` text actions
- trigger cleanup automatically when recording ends
- use Ollama local model `gemma4:e4b` as the model-backed cleanup path
- send `keep_alive` with cleanup requests so the model stays warm for subsequent rounds
- use cleanup output as the parse input
- keep showing both raw and cleaned transcript in session history data

## 4. Out Of Scope

- replacing DeepSeek parsing with local models
- using DeepSeek as the cleanup fallback in this version
- auto-submit on silence timeout
- clearing persisted conversation history
- cleanup streaming output
- introducing a new backend database session concept

## 5. Frontend Interaction Design

### 5.1 Text States

The frontend should track at least two distinct transcript states:

- `liveTranscript`: text shown while recording is in progress
- `currentTranscript`: editable or displayable text that represents the latest cleanup result and becomes the submit source

The key rule is that the text shown after cleanup must be the same text later used by submit.

Implementation direction for this version:

- keep `liveTranscript` for recording-time display
- keep a separate `currentTranscript` for the cleanup result used by submit
- if raw final transcript must still be preserved in frontend state, store it separately and do not overload `currentTranscript`

### 5.2 Buttons

The voice area should support four explicit actions:

- `开始录音`
- `结束录音`
- `Reset`
- `Submit`

Behavior:

- `开始录音`: starts a new recording round and updates live transcript only
- `结束录音`: stops recording and triggers cleanup automatically
- `Reset`: clears only the current transcript display and current cleanup result; does not clear conversation history
- `Submit`: parses the current transcript if it is non-empty after trim

### 5.3 Submit Guard

Before calling parse, the frontend must check:

```text
currentTranscript.trim() !== ''
```

If empty:

- do not call parse
- show a concise user-facing warning

### 5.4 Conversation History Timing

Conversation history should be written only when parse succeeds.

This preserves the meaning of each history round:

- one user message
- one AI parse response
- one set of recognized updates and missing-field hints

Cleanup by itself does not yet represent a complete conversation round.

## 6. Backend Responsibility Split

### 6.1 Cleanup

Cleanup remains a dedicated backend capability.

It should:

- receive a raw final transcript
- run deterministic local rules first
- attempt Ollama cleanup second when cleanup is enabled and transcript length reaches the threshold
- return the cleaned text plus metadata

It must not:

- infer fields
- write business response text
- replace parse

### 6.2 Parse

Parse remains a separate backend capability.

It should:

- receive the already cleaned transcript from frontend submit
- run DeepSeek structured extraction
- return `respMessage`, `updates`, `overwriteFields`, and related metadata

It should not be responsible for deciding when cleanup happens in the UI interaction.

## 7. Cleanup Pipeline

### 7.1 Execution Order

Recommended cleanup order:

1. trim raw transcript
2. apply deterministic cleanup rules
3. if Ollama is enabled and text length threshold is reached, call Ollama cleanup
4. validate returned text
5. fall back to rule-cleaned text on any failure

### 7.2 Deterministic Rules

Rules should remain conservative:

- remove extra whitespace
- remove common filler words
- collapse duplicated punctuation
- merge only exact or clearly duplicated adjacent fragments that can be removed without changing meaning

Rules must not:

- change dates or times
- change names
- change places
- change counts
- add facts

### 7.3 Ollama Model

Use:

- local Ollama
- model: `gemma4:e4b`

Runtime behavior:

- cleanup requests send `keep_alive`
- short timeout remains preferred
- low or zero temperature
- skip model cleanup for very short transcripts

The keep-alive goal is to reduce repeated cold starts between consecutive voice rounds while still allowing Ollama to manage model lifetime normally.

## 8. Ollama Prompt Contract

The cleanup prompt must be explicitly conservative.

Required model behavior:

- remove filler words such as `嗯` / `啊` / `呃` / `那个`
- add only necessary punctuation
- merge only clearly repeated spoken fragments
- preserve the original meaning exactly

Forbidden model behavior:

- do not change time values
- do not change dates
- do not change person names
- do not change place names
- do not change counts, numbers, or phone numbers
- do not add information that is not in the source
- do not paraphrase for style if the meaning could drift
- if uncertain, keep the original wording

Output rule:

- return only the cleaned Chinese transcript text itself
- do not return explanations, labels, JSON, or markdown

## 9. API Behavior

### 9.1 Cleanup Response

Cleanup should return a shape equivalent to:

```json
{
  "rawTranscript": "那个 我明天中午十二点返回",
  "cleanedTranscript": "我明天中午十二点返回。",
  "cleanupMeta": {
    "ruleApplied": true,
    "ollamaAttempted": true,
    "ollamaUsed": true,
    "fallbackToRuleCleaned": false
  }
}
```

### 9.2 Parse Request Source

Parse should receive the cleaned transcript as `transcript`.

This means the parse stage treats cleanup as already resolved input, even if the backend parse service still returns `rawTranscript` and `cleanedTranscript` for debugging.

## 10. Failure Handling

### 10.1 Cleanup Failure

If Ollama:

- is unavailable
- times out
- returns invalid content
- returns unsafe content

then cleanup must:

- fall back to the rule-cleaned text
- return that fallback text to frontend
- not block later submit

### 10.2 Submit Failure

If parse fails after submit:

- do not create a completed conversation round
- keep the current cleaned text in place so the user can retry
- show a concise error message

### 10.3 Reset

Reset should:

- clear only the current working transcript state
- not remove session history
- not trigger cleanup or parse

## 11. History And Debuggability

Even though history records are created only on parse success, each record should still store:

- user-visible submitted transcript
- raw transcript if available
- cleaned transcript
- parse response message
- updates
- overwrite fields
- missing-field summary

This allows later comparison of:

- what ASR produced
- what cleanup produced
- what parse consumed

## 12. Testing Strategy

### Frontend

Add or update tests for:

- ending recording triggers cleanup, not parse
- cleanup result replaces the current transcript shown for submit
- reset clears only current text state
- submit blocks on empty cleaned text
- submit calls parse with cleaned transcript
- history round is created on parse success only

### Backend

Add or update tests for:

- cleanup prompt contains the strict preservation constraints
- cleanup request includes `keep_alive`
- unsafe Ollama output falls back to rule-cleaned text
- parse consumes the cleaned text path

## 13. Acceptance Criteria

This design is complete when:

- ending recording automatically triggers cleanup
- cleanup uses Ollama with `keep_alive`
- cleaned transcript replaces the current text shown to the user
- submit does nothing for empty trimmed text
- submit parses the cleaned transcript, not the raw final transcript
- parse success creates one conversation history round
- reset clears only the current text state
- cleanup prompt is explicitly constrained to avoid information loss
