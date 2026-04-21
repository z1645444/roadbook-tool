# Phase 3: Multi-day Optimization and Stage Split - Research

**Researched:** 2026-04-21
**Domain:** Waypoint reordering and multi-day stage splitting for cycling roadbooks
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints

### Locked Decisions
- No phase-specific `03-CONTEXT.md` exists, so there are no discuss-phase locked decisions to
  import for Phase 3.
- Phase 3 scope is multi-day optimization and stage splitting only.
- Phase 3 must satisfy `ROUT-03` and `ROUT-04`.
- Start and end points must remain fixed while waypoint order may be optimized.
- Output must expose explicit day boundaries and overnight stops.

### the agent's Discretion
- Exact optimization strategy for intermediate waypoints (full permutation vs heuristic).
- Exact stage split tie-break strategy when multiple boundaries satisfy constraints.
- Internal artifact schema shape for per-day route payload extensions.

### Deferred Ideas
- Lodging candidate retrieval and lodging policy enforcement stay in Phase 4.
- Final markdown rendering and output packaging stay in Phase 5.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Guidance |
|----|-------------|-------------------|
| ROUT-03 | Reorder waypoints to optimize route feasibility under constraints. | Add a deterministic optimizer that preserves start/end and reorders only intermediate points. |
| ROUT-04 | Split route into day stages using daily intensity and time-window limits. | Add a stage splitter using `intensity.caps` and `rideWindow.minutes` as hard constraints. |
</phase_requirements>

## Summary

Phase 3 should extend, not replace, the Phase 2 routing pipeline. The existing routing stack already
provides deterministic segment generation and fallback handling; this phase should add:
1) intermediate waypoint optimization, and
2) multi-day stage boundaries.

The safest architecture is to keep optimization and stage split as dedicated services, then compose
them inside `RoutingOrchestratorService`. This keeps Phase 2 behavior stable for one-day trips while
adding multi-day planning logic only when `tripDays.normalized > 1`.

## Architecture Direction

### Recommended Flow
1. Build accepted point list: `origin -> waypoints -> destination`.
2. Optimize waypoint order while preserving endpoints.
3. Build ordered route segments for optimized points.
4. Split segments into day stages under:
   - `intensity` ride-minute cap
   - `rideWindow.minutes` cap
5. Emit explicit per-day boundaries and overnight stops.

### Module Responsibilities
- `src/routing/waypoint-optimizer.service.ts`
  - Endpoint-preserving reorder of intermediate waypoints.
  - Deterministic tie-break rules.
- `src/routing/day-stage-splitter.service.ts`
  - Segment-to-day partitioning.
  - Overflow and boundary handling.
- `src/routing/routing-orchestrator.service.ts`
  - Compose optimization and split stages.
  - Preserve one-day behavior for `tripDays=1`.

## Candidate Patterns from Current Codebase

- Deterministic ordered aggregation pattern from `segment-routing.service.ts`.
- Gate-first control-flow pattern from `slot-resolver.service.ts`.
- Stable metadata + persistence update pattern from `repro-metadata.service.ts` and repository.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Non-deterministic reordering | Flaky routes and hard-to-debug regressions | Deterministic tie-break keys and fixed fixture tests |
| Stage overflow due to strict caps | Unusable itinerary output | Explicit fallback strategy: forced split at segment boundary with overflow marker |
| Regressing Phase 2 one-day behavior | Functional regression | Keep one-day guard path and add regression coverage in Phase 3 integration tests |

## Validation Architecture

### Test Layers
- Unit
  - Waypoint optimizer deterministic behavior (`ROUT-03`)
  - Stage splitter cap compliance (`ROUT-04`)
- Integration
  - Orchestrator multi-day path with optimized order and day boundaries
  - Regression guard for one-day route behavior

### Required New Tests
- `tests/routing/waypoint-optimization.test.ts`
- `tests/routing/day-stage-split.test.ts`
- `tests/routing/phase3-multiday-integration.test.ts`

### Verification Commands
- `pnpm vitest run tests/routing/waypoint-optimization.test.ts -t "ROUT-03"`
- `pnpm vitest run tests/routing/day-stage-split.test.ts -t "ROUT-04"`
- `pnpm vitest run tests/routing/phase3-multiday-integration.test.ts`
- `pnpm vitest run tests/routing --reporter=dot`

## Planning Recommendation

Split Phase 3 into three plans:
1. Optimization core (`ROUT-03`).
2. Stage split core (`ROUT-04`).
3. Orchestrator/controller integration + full requirement regression.

This keeps each plan small, testable, and wave-ordered with clear dependencies.

