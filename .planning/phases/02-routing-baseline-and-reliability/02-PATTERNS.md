# Phase 2: Routing Baseline and Reliability - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 14
**Analogs found:** 13 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/map-provider/map-provider.port.ts` | provider | request-response | `src/conversation/constraint-extractor.interface.ts` | exact |
| `src/map-provider/amap-geocode.adapter.ts` | service | request-response | `src/conversation/intake.controller.ts` | role-match |
| `src/map-provider/amap-bicycling.adapter.ts` | service | request-response | `src/constraints/constraint-draft.repository.ts` | role-match |
| `src/map-provider/amap-error.mapper.ts` | utility | transform | `src/conversation/clarification-policy.service.ts` | exact |
| `src/routing/routing-orchestrator.service.ts` | service | request-response | `src/conversation/slot-resolver.service.ts` | exact |
| `src/routing/segment-routing.service.ts` | service | transform | `src/recap/recap-projection.service.ts` | role-match |
| `src/reliability/repro-metadata.service.ts` | service | transform | `src/constraints/constraint-patch.service.ts` | role-match |
| `src/reliability/routing-fallback.error.ts` | utility | request-response | - | none |
| `src/shared/validation/route-artifact.schema.ts` | model | transform | `src/shared/validation/constraint-draft.schema.ts` | exact |
| `tests/routing/geocode-disambiguation.test.ts` | test | request-response | `tests/constraints/waypoint-normalization.test.ts` | exact |
| `tests/routing/bicycling-segments.test.ts` | test | request-response | `tests/conversation/intake-confirmation.test.ts` | role-match |
| `tests/routing/single-day-guard.test.ts` | test | request-response | `tests/conversation/intake-confirmation.test.ts` | role-match |
| `tests/reliability/amap-fallback-errors.test.ts` | test | transform | `tests/constraints/waypoint-normalization.test.ts` | exact |
| `tests/reliability/route-metadata-hash.test.ts` | test | transform | `tests/recap/canonical-projection.test.ts` | exact |

## Pattern Assignments

### `src/map-provider/map-provider.port.ts` (provider, request-response)

**Analog:** `src/conversation/constraint-extractor.interface.ts`

**Port + implementation split** (lines 3-16):
```typescript
export interface ConstraintExtractor {
  extractConstraints(input: IntakeTurnDto): ExtractedConstraint[];
}

export class ParserFirstConstraintExtractor implements ConstraintExtractor {
  extractConstraints(input: IntakeTurnDto): ExtractedConstraint[] {
```

Use the same pattern for `MapProvider` interface + `AmapMapProvider` adapter class.

---

### `src/map-provider/amap-geocode.adapter.ts` (service, request-response)

**Analog:** `src/conversation/intake.controller.ts`

**Import + typed response boundary** (lines 1-18):
```typescript
import { Body, Controller, Post } from '@nestjs/common';
...
export interface IntakeTurnResponse {
  status: SlotResolutionState['status'];
  missingSlots: string[];
  clarificationPrompt: string | null;
```

**Core gate before next stage** (lines 37-47, 55-64):
```typescript
const pointDecision = firstPoint ? evaluatePointResolution(...) : null;

const resolution = this.slotResolver(
  draft,
  pointDecision?.clarificationNeeded
    ? { needsClarification: true, slot: firstPoint?.key ?? 'point', prompt: ... }
    : { needsClarification: false }
);
```

Apply this as `geocode -> decision -> either block for clarification or continue`.

---

### `src/map-provider/amap-bicycling.adapter.ts` (service, request-response)

**Analog:** `src/constraints/constraint-draft.repository.ts`

**Async adapter method style** (lines 47-52, 54-73):
```typescript
async getBySessionId(sessionId: string): Promise<ConstraintDraft | null> {
  const storage = await this.readStorage();
  const draft = storage.sessions[sessionId];
  return draft ? cloneDraft(draft) : null;
}

async updateDraft(...): Promise<ConstraintDraft> {
  const storage = await this.readStorage();
  ...
  await this.writeStorage(storage);
  return cloneDraft(storage.sessions[sessionId]);
}
```

Mirror this async-return and defensive handling pattern for provider calls.

---

### `src/map-provider/amap-error.mapper.ts` (utility, transform)

**Analog:** `src/conversation/clarification-policy.service.ts`

**Centralized deterministic branching** (lines 15-39):
```typescript
export const evaluateClarificationNeed = (...) => {
  if (candidateCount > 1) { ... }
  if (confidence < MIN_ACCEPT_CONFIDENCE) { ... }
  if (confidence < 0.95) { ... }
  return { disposition: 'accepted', ... };
};
```

Use one pure mapper function for `infocode -> domain class -> user fallback message`.

---

### `src/routing/routing-orchestrator.service.ts` (service, request-response)

**Analog:** `src/conversation/slot-resolver.service.ts`

**Ordered gate pipeline** (lines 23-31, 74-95):
```typescript
const REQUIRED_SLOT_ORDER: Array<keyof ConstraintDraft['slots']> = [ ... ];

export const resolveNextSlotAction = (...) => {
  if (clarification.needsClarification && ...) {
    return { status: 'need_clarification', ... };
  }

  for (const slot of REQUIRED_SLOT_ORDER) {
    if (!slotIsAccepted(draft, slot)) {
      return { status: 'need_slot', slot };
    }
  }
```

Copy this for `geocode -> ambiguity gate -> segment route -> single-day guard`.

---

### `src/routing/segment-routing.service.ts` (service, transform)

**Analog:** `src/recap/recap-projection.service.ts`

**Deterministic aggregation over ordered sections** (lines 24-33, 39-45):
```typescript
const sections = [
  formatPoint('Origin', draft.slots.origin?.raw),
  formatPoint('Destination', draft.slots.destination?.raw),
  `Waypoints: ${draft.slots.waypoints.map((item) => item.raw).join(', ') || 'none'}`,
  ...
];

return {
  summary: buildSummary(sections),
  sections,
  ...
};
```

Use this style to aggregate ordered route segments and total metrics.

---

### `src/reliability/repro-metadata.service.ts` (service, transform)

**Analog:** `src/constraints/constraint-patch.service.ts`

**Metadata append on each change** (lines 11-14, 26-31):
```typescript
const changedFields = Object.keys(patch).filter(...);
...
for (const field of changedFields) {
  nextDraft.revisionLog.push({
    field,
    turnId,
    timestampIso
  });
}
```

Keep metadata generation explicit and append-only (timestamp + fingerprints + hash).

---

### `src/shared/validation/route-artifact.schema.ts` (model, transform)

**Analog:** `src/shared/validation/constraint-draft.schema.ts`

**Zod object + superRefine invariants** (lines 16-29, 31-44):
```typescript
const pointSlotSchema = z.object(...).superRefine((value, ctx) => {
  if (value.status === 'accepted' && !value.normalized) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: ... });
  }
});
```

**Safe-parse boundary export** (lines 146-147):
```typescript
export const safeParseConstraintDraft = (payload: unknown) =>
  constraintDraftSchema.safeParse(payload);
```

Use the same `safeParse` export for route artifact and metadata payload.

---

### `tests/routing/geocode-disambiguation.test.ts` (test, request-response)

**Analog:** `tests/constraints/waypoint-normalization.test.ts`

**Requirement-named suite + direct decision assertions** (lines 13-31):
```typescript
describe('CONV-02 waypoint normalization and ambiguity handling', () => {
  it('should force a blocking clarification response ...', () => {
    const decision = evaluatePointResolution(...);
    expect(decision.ambiguous).toBe(true);
    expect(decision.clarificationNeeded).toBe(true);
```

Copy this structure with `ROUT-01` naming and ambiguity-blocking expectations.

---

### `tests/routing/bicycling-segments.test.ts` (test, request-response)

**Analog:** `tests/conversation/intake-confirmation.test.ts`

**End-to-end behavior progression test shape** (lines 49-106):
```typescript
it('should emit ready_for_confirmation only when all required slots are accepted', () => {
  const draft = createConstraintDraft(...);
  ...
  const next = resolveNextSlotAction(draft);
  expect(next.status).toBe('ready_for_confirmation');
});
```

Adapt to ordered segment assertions (`P0->P1->P2`, totals preserved).

---

### `tests/routing/single-day-guard.test.ts` (test, request-response)

**Analog:** `tests/conversation/intake-confirmation.test.ts`

**Gate assertion pattern** (lines 110-130):
```typescript
it('should return confirmationRequired and cannot proceed without confirmation', () => {
  const response = controller.processTurn(...);
  expect(response.confirmationRequired).toBe(true);
  expect(response.status).toBe('ready_for_confirmation');
});
```

Use this style for `ROUT-05`: enforce one-day artifact when `tripDays.normalized === 1`.

---

### `tests/reliability/amap-fallback-errors.test.ts` (test, transform)

**Analog:** `tests/constraints/waypoint-normalization.test.ts`

**Threshold/branch table assertions** (lines 26-31, 33-37):
```typescript
const decision = evaluateClarificationNeed('waypoint', ...);
expect(decision.clarificationNeeded).toBe(true);
...
expect(decision.assumed).toBe(true);
expect(decision.assumption).toMatch(/Assumed waypoint/i);
```

Apply this to assert `infocode` class mapping and fallback text class.

---

### `tests/reliability/route-metadata-hash.test.ts` (test, transform)

**Analog:** `tests/recap/canonical-projection.test.ts`

**Projection consistency checks after updates** (lines 93-113):
```typescript
const patched = applyConstraintPatch(...);
const recap = regenerateFullRecap(patched);
expect(recap.summary).toContain('Origin: 北京');
expect(patched.revisionLog.at(-1)?.field).toBe('intensity');
```

Reuse this for RELY-03 by asserting required metadata fields and deterministic recompute.

## Shared Patterns

### Validation Boundary
**Source:** `src/main.ts`  
**Apply to:** New controller/DTO entrypoints
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  })
);
```

### Ambiguity Blocking
**Source:** `src/conversation/clarification-policy.service.ts`, `src/conversation/slot-resolver.service.ts`  
**Apply to:** Geocode + routing orchestrator
```typescript
if (candidateCount > 1) {
  return {
    disposition: 'ambiguous',
    clarificationNeeded: true,
    prompt: `Found multiple candidates for ${slot}. Please clarify by choosing one.`
  };
}
```

### Deterministic Canonical Projection
**Source:** `src/recap/recap-projection.service.ts`  
**Apply to:** Route artifact and reproducibility metadata output
```typescript
const sections = [ ... ];
return {
  summary: buildSummary(sections),
  sections
};
```

### Storage/Persistence Safety Pattern
**Source:** `src/constraints/constraint-draft.repository.ts`  
**Apply to:** Any persisted route metadata artifact
```typescript
await mkdir(dirname(this.storagePath), { recursive: true });
const tempPath = `${this.storagePath}.tmp`;
await writeFile(tempPath, `${JSON.stringify(storage, null, 2)}\n`, 'utf8');
await rename(tempPath, this.storagePath);
```

### Test Naming + Requirement Traceability
**Source:** `tests/conversation/intake-confirmation.test.ts`, `tests/constraints/waypoint-normalization.test.ts`  
**Apply to:** `tests/routing/*` and `tests/reliability/*`
```typescript
describe('ROUT-01 ...', () => {
  it('should ...', () => { ... });
});
```

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/reliability/routing-fallback.error.ts` | utility | request-response | Repository has no existing typed domain error class or custom exception hierarchy; only plain `Error` throws are present. |

## Metadata

**Analog search scope:** `src/**`, `tests/**`, `.planning/phases/02-routing-baseline-and-reliability/02-RESEARCH.md`  
**Files scanned:** 20  
**Pattern extraction date:** 2026-04-21
