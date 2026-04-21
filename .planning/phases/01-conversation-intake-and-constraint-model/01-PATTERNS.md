# Phase 1: Conversation Intake and Constraint Model - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 20
**Analogs found:** 19 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `package.json` | config | batch | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | role-match |
| `vitest.config.ts` | config | batch | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | role-match |
| `src/main.ts` | config | request-response | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/conversation/intake.controller.ts` | controller | request-response | `.planning/research/ARCHITECTURE.md` | role-match |
| `src/conversation/slot-resolver.service.ts` | service | request-response | `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md` | exact |
| `src/conversation/clarification-policy.service.ts` | service | request-response | `.planning/research/PITFALLS.md` | exact |
| `src/constraints/constraint-draft.model.ts` | model | CRUD | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/constraints/constraint-normalizer.service.ts` | service | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/constraints/constraint-patch.service.ts` | service | CRUD | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/constraints/constraint-draft.repository.ts` | service | CRUD | - | none |
| `src/recap/recap-projection.service.ts` | service | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/shared/validation/intake-turn.dto.ts` | model | request-response | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | role-match |
| `src/shared/validation/constraint-draft.schema.ts` | utility | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `src/shared/time/time-window.parser.ts` | utility | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` | exact |
| `tests/conversation/intake-confirmation.test.ts` | test | request-response | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |
| `tests/constraints/waypoint-normalization.test.ts` | test | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |
| `tests/constraints/date-range.test.ts` | test | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |
| `tests/constraints/ride-window.test.ts` | test | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |
| `tests/constraints/intensity-profile.test.ts` | test | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |
| `tests/recap/canonical-projection.test.ts` | test | transform | `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` | exact |

## Pattern Assignments

### `src/main.ts` (config, request-response)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Imports + validation boundary** (lines 272-279):
```typescript
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

Apply this as global bootstrap default for inbound conversation DTOs.

---

### `src/conversation/intake.controller.ts` (controller, request-response)

**Analog:** `.planning/research/ARCHITECTURE.md`

**Controller responsibility boundary** (lines 21-23):
```text
Chat Channel Adapter -> Conversation Application Service -> Planning Orchestrator
```

**Core request-response flow** (lines 53-57):
```text
User -> Chat Adapter -> Conversation Service
Conversation Service -> Planning Orchestrator
Send a validated PlanTripCommand
```

**Confirmation gate behavior** (from context lines 24-27):
```text
Planning cannot proceed until user confirms or corrects recap.
Ask only missing/uncertain slots each turn.
```

---

### `src/conversation/slot-resolver.service.ts` (service, request-response)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md`

**Slot-driven capture pattern** (lines 22-27):
```text
Capture origin, destination, waypoints, date range, trip days, daily window, intensity.
Ask only missing or uncertain slots each turn.
Avoid re-asking accepted fields.
```

**Ambiguity gate** (lines 38-43):
```text
Ambiguous location resolution is blocking.
Use confidence-gated clarification prompts.
Surface unavoidable assumptions in recap with one-turn correction path.
```

---

### `src/conversation/clarification-policy.service.ts` (service, request-response)

**Analog:** `.planning/research/PITFALLS.md`

**Clarification policy** (lines 41-44):
```text
Mandatory slot confirmation before route commit.
Confidence-gated clarification prompts when confidence is below threshold.
Render assumptions and require explicit confirmation for low-confidence fields.
```

**Warning signs to encode as metrics** (lines 35-39):
```text
High correction follow-ups, plausible geocode ties, high replan rates.
```

---

### `src/constraints/constraint-draft.model.ts` (model, CRUD)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Canonical aggregate shape** (lines 183-195):
```typescript
type ConstraintDraft = {
  id: string;
  slots: {
    origin?: { raw: string; normalized?: CanonicalPoint; status: 'missing' | 'accepted' | 'ambiguous' };
    destination?: { raw: string; normalized?: CanonicalPoint; status: 'missing' | 'accepted' | 'ambiguous' };
    waypoints: Array<{ raw: string; normalized?: CanonicalPoint; status: 'accepted' | 'ambiguous' }>;
    dateRange?: { raw: string; normalized?: { startDate: string; endDate: string } };
    tripDays?: { raw: string; normalized?: number };
    rideWindow?: { raw: string; normalized?: { start: string; end: string; minutes: number } };
    intensity?: { raw: string; normalized?: 'easy' | 'standard' | 'challenge' };
  };
  revisionLog: Array<{ field: string; turnId: string; timestampIso: string }>;
};
```

This is the source-of-truth contract for RELY-02.

---

### `src/constraints/constraint-normalizer.service.ts` (service, transform)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md`

**Normalization-at-write rule** (lines 34-35):
```text
Normalize at write time: km, hours, 24h local time, CNY.
Store normalized values in canonical draft.
```

**Traceability requirement** (lines 32-33):
```text
Persist raw user inputs and normalized values together.
```

---

### `src/constraints/constraint-patch.service.ts` (service, CRUD)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Field-level patch + revision log** (lines 218-226):
```typescript
function applyPatch(draft: ConstraintDraft, patch: Partial<ConstraintDraft['slots']>, turnId: string): ConstraintDraft {
  const next = { ...draft, slots: { ...draft.slots, ...patch } };
  const changedKeys = Object.keys(patch);
  next.revisionLog = [
    ...draft.revisionLog,
    ...changedKeys.map((field) => ({ field, turnId, timestampIso: new Date().toISOString() })),
  ];
  return next;
}
```

**Consistency recap rule** (context lines 48-49):
```text
Regenerate a full consistency recap after each accepted revision.
```

---

### `src/recap/recap-projection.service.ts` (service, transform)

**Analog:** `.planning/research/PITFALLS.md`

**Recap projection rule** (lines 173-176):
```text
Treat markdown as view layer.
Maintain canonical JSON schema.
Generate recap/markdown deterministically from schema.
Store machine artifact + rendered output with shared version id.
```

**Drift prevention** (lines 253-257):
```text
Do not incrementally edit recap text; regenerate from canonical state after revisions.
```

---

### `src/shared/validation/intake-turn.dto.ts` (model, request-response)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Boundary enforcement settings** (lines 204-210):
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

Map required conversation slots to DTO fields and reject over-posted payloads.

---

### `src/shared/validation/constraint-draft.schema.ts` (utility, transform)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Schema parse pattern** (lines 286-291):
```typescript
const result = schema.safeParse(payload);
if (!result.success) {
  return { ok: false, issues: result.error.issues };
}
return { ok: true, data: result.data };
```

Use this for deterministic parse/validation before draft write.

---

### `src/shared/time/time-window.parser.ts` (utility, transform)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md`

**Time parse validity pattern** (lines 296-301):
```typescript
import { DateTime } from 'luxon';

const parsed = DateTime.fromISO('2026-05-01T08:00:00+08:00');
if (!parsed.isValid) {
  throw new Error(parsed.invalidReason ?? 'invalid datetime');
}
```

Apply strict parse + semantic validation (`start < end`) before acceptance.

---

### Test Files (test, request-response/transform)

**Analogs:** `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` and `.planning/REQUIREMENTS.md`

**Test inventory and naming contract** (validation lines 41-47, 55-60):
```text
tests/conversation/intake-confirmation.test.ts  -> CONV-01
tests/constraints/waypoint-normalization.test.ts -> CONV-02
tests/constraints/date-range.test.ts -> CONV-03
tests/constraints/ride-window.test.ts -> CONV-04
tests/constraints/intensity-profile.test.ts -> CONV-05
tests/recap/canonical-projection.test.ts -> RELY-02
```

**Requirement IDs to assert against** (requirements lines 10-14, 42):
```text
CONV-01..CONV-05 and RELY-02 are mandatory for Phase 1.
```

---

### `package.json` and `vitest.config.ts` (config, batch)

**Analog:** `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md`

**Execution contract** (lines 20-24):
```text
Framework: vitest 4.1.4
Quick run: pnpm vitest run tests/conversation --reporter=dot
Full run: pnpm vitest run
```

**Wave 0 baseline** (line 54):
```text
package.json + vitest.config.ts are required bootstrap artifacts.
```

## Shared Patterns

### Validation Boundary
**Source:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` lines 204-210  
**Apply to:** `src/main.ts`, all inbound DTO handlers
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

### Ambiguity Blocking + Clarification Gate
**Source:** `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md` lines 38-43  
**Apply to:** conversation intake services/controller
```text
Ambiguous inputs are blocking; require user clarification before accept.
Use confidence-gated prompts and explicit assumptions with one-turn correction.
```

### Canonical Source-of-Truth + Projection
**Source:** `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md` lines 30-35, `.planning/research/PITFALLS.md` lines 173-176  
**Apply to:** constraints + recap modules
```text
Canonical machine-readable draft is primary state.
Recap/markdown is deterministic projection from canonical draft.
```

### Patch Merge + Revision Audit
**Source:** `.planning/phases/01-conversation-intake-and-constraint-model/01-RESEARCH.md` lines 218-226 and `01-CONTEXT.md` lines 49-50  
**Apply to:** draft patch service/repository
```text
Field-level patch only; preserve unrelated accepted slots.
Record updated field, source turn, and timestamp for each revision.
```

### Test-to-Requirement Traceability
**Source:** `.planning/phases/01-conversation-intake-and-constraint-model/01-VALIDATION.md` lines 39-47  
**Apply to:** all Phase 1 tests
```text
Each test file maps directly to CONV/RELY requirement IDs and must be runnable via vitest command.
```

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/constraints/constraint-draft.repository.ts` | service | CRUD | No concrete repository/storage code exists yet; only architectural responsibility text exists in `.planning/research/ARCHITECTURE.md` line 30 and `01-RESEARCH.md` lines 84-85. |

## Metadata

**Analog search scope:** repository root and `.planning/**`  
**Files scanned:** 15  
**Strong analog files used:** 5 (`01-RESEARCH.md`, `01-CONTEXT.md`, `01-VALIDATION.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`)  
**Pattern extraction date:** 2026-04-20
