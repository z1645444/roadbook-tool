# Phase 3: Multi-day Optimization and Stage Split - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 10
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/routing/waypoint-optimizer.service.ts` | service | transform | `src/routing/segment-routing.service.ts` | exact |
| `src/routing/day-stage-splitter.service.ts` | service | transform | `src/recap/recap-projection.service.ts` | role-match |
| `src/shared/validation/multiday-route-artifact.schema.ts` | model | transform | `src/shared/validation/route-artifact.schema.ts` | exact |
| `src/routing/routing-orchestrator.service.ts` | service | request-response | `src/routing/routing-orchestrator.service.ts` | exact |
| `src/conversation/intake.controller.ts` | controller | request-response | `src/conversation/intake.controller.ts` | exact |
| `tests/routing/waypoint-optimization.test.ts` | test | transform | `tests/routing/bicycling-segments.test.ts` | exact |
| `tests/routing/day-stage-split.test.ts` | test | transform | `tests/routing/single-day-guard.test.ts` | role-match |
| `tests/routing/phase3-multiday-integration.test.ts` | test | request-response | `tests/routing/phase2-routing-integration.test.ts` | exact |
| `tests/conversation/intake-confirmation.test.ts` | test | request-response | `tests/conversation/intake-confirmation.test.ts` | exact |
| `tests/routing/single-day-guard.test.ts` | test | request-response | `tests/routing/single-day-guard.test.ts` | exact |

## Pattern Assignments

### `src/routing/waypoint-optimizer.service.ts`
- Keep pure-function style like `summarizeRouteSegments`.
- Deterministic output only: same inputs must produce same reordered sequence.

### `src/routing/day-stage-splitter.service.ts`
- Use explicit boundary calculation and predictable loop progression.
- Emit day objects with segment slices and totals.

### `src/shared/validation/multiday-route-artifact.schema.ts`
- Mirror zod schema + `safeParse` export style from route artifact schema.
- Validate day-level totals and boundary fields.

### `src/routing/routing-orchestrator.service.ts`
- Keep existing fallback and clarification behavior.
- Add multi-day branch guarded by `tripDays.normalized > 1`.

### `src/conversation/intake.controller.ts`
- Preserve existing response-shape contract.
- Extend route plan payload with boundary data without breaking one-day path.

### `tests/routing/*`
- Requirement-tagged suite names (`ROUT-03`, `ROUT-04`).
- Deterministic fixtures and stable expectations.
- Integration coverage follows phase2-style harness.

