# Phase 1: Conversation Intake and Constraint Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves alternatives considered.

**Date:** 2026-04-20
**Phase:** 1-conversation-intake-and-constraint-model
**Areas discussed:** Intake flow, Canonical model, Ambiguity policy, Revision semantics

---

## Intake Flow and Confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Slot-driven flow with explicit recap gate | Collect required fields progressively and block planning until recap confirmed | ✓ |
| Free-form intake with post-hoc parse | Let users describe everything first, then infer structure afterward | |
| Hybrid with optional recap | Ask structured questions only when parsing fails | |

**User's choice:** Slot-driven flow with explicit recap gate
**Notes:** `[auto]` Selected recommended default to satisfy `CONV-01` to `CONV-05` consistency and
prevent false-precision planning.

---

## Canonical Constraint Model

| Option | Description | Selected |
|--------|-------------|----------|
| Canonical itinerary draft (raw + normalized fields) | Keep one machine-readable source of truth and derive recap output from it | ✓ |
| Markdown-first draft | Use recap text as primary artifact and parse it for downstream use | |
| Partial schema only | Canonicalize only core fields, keep others as loose text | |

**User's choice:** Canonical itinerary draft (raw + normalized fields)
**Notes:** `[auto]` Selected recommended default to satisfy `RELY-02` and keep deterministic
handoff to later routing/renderer phases.

---

## Ambiguity and Validation Policy

| Option | Description | Selected |
|--------|-------------|----------|
| Clarify before accept (blocking) | Require user disambiguation for low-confidence location/constraint inputs | ✓ |
| Auto-pick best guess | Accept top candidate and continue unless user complains | |
| Auto-pick with warning | Continue with inferred value and attach warning in recap | |

**User's choice:** Clarify before accept (blocking)
**Notes:** `[auto]` Selected recommended default to reduce ambiguous geocoding risk and avoid
silent assumption failures highlighted in research pitfalls.

---

## Revision Semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Field-level patch + full recap | Keep accepted fields, apply targeted edits, then regenerate full consistency recap | ✓ |
| Restart on every edit | Reset intake whenever any field changes | |
| Silent in-place edits | Apply edits without full recap regeneration | |

**User's choice:** Field-level patch + full recap
**Notes:** `[auto]` Selected recommended default to preserve user-entered constraints while
ensuring consistency after each change.

---

## the agent's Discretion

- Confidence threshold tuning details.
- Internal model and module naming.
- Prompt tone and exact phrasing.

## Deferred Ideas

None.
