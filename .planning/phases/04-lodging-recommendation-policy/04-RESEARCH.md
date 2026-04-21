# Phase 4: Lodging Recommendation Policy - Research

**Researched:** 2026-04-21
**Domain:** AMap-based lodging recommendation policy near overnight stops
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints

### Locked Decisions
- Use `overnightStopPoint` as the only retrieval anchor for each day (`D-01`).
- Do not run lodging retrieval for single-day plans without nightly stops (`D-02`).
- Start radius at `8km`, expand `8km -> 12km -> 20km` (`D-03`, `D-19`).
- Query categories in serial order (hostel -> guesthouse -> hotel), dedupe by `providerId`, and
  cap each category at top 3 entries (`D-06`, `D-07`, `D-08`, `D-17`).
- Enforce strict quality floor `rating >= 4.0` and configured price policies (`D-14`, `D-15`).
- Fallback order is fixed: expand radius first, then relax price cap by `+20%`; never relax
  rating floor (`D-18`, `D-20`, `D-21`).
- Keep fallback auditable via policy-stage trace in output (`D-26`).
- Extend `MapProvider` abstraction instead of direct AMap calls in orchestrators (`D-09`).

### the agent's Discretion
- Final adapter/class names and file split between retrieval, policy filtering, and formatter.
- Cache key exact shape for session+anchor candidate cache (`D-12`).
- AMap type whitelist constants per category (`D-10`).

### Deferred Ideas
- Booking/payment flows and OTA integration.
- Frontend map UI rendering.
- Single-day end-point lodging recommendation mode.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Guidance |
|----|-------------|-------------------|
| LODG-01 | Search lodging candidates near nightly stop points via AMap POI APIs. | Add provider-port lodging search method and AMap lodging-around adapter with strict query envelope. |
| LODG-02 | Hostel recommendations satisfy rating >= 4.0 and price 40-100 CNY. | Implement category-specific policy filter with nightly-price normalization and policy-stage tagging. |
| LODG-03 | Guesthouse recommendations satisfy rating >= 4.0 and price <= 200 CNY. | Same policy engine as hostel with guesthouse-specific cap and shared ranking order. |
| LODG-04 | Hotel recommendations satisfy rating >= 4.0 and price <= 200 CNY. | Reuse category policy pipeline with hotel type whitelist and top-3 quota. |
| LODG-05 | Present fallback strategy when strict filters return no results. | Persist fallback attempt trace and return explicit no-match status after final stage. |
</phase_requirements>

## Summary

Phase 4 should be implemented as a deterministic policy pipeline attached to multi-day day-stage
artifacts from Phase 3. The safest shape is:
1. retrieve raw candidates per day anchor through `MapProvider`,
2. normalize price/rating fields,
3. apply strict policy filters,
4. apply staged fallback policy when needed,
5. return day-grouped comparison payload with fallback trace.

This phase should avoid leaking provider payload shapes to orchestration and should preserve
existing reliability behavior by reusing mapped provider errors and safe fallback responses.

## Architecture Direction

### Recommended Flow
1. Read `routePlan[]` from `RoutingOrchestratorService` output.
2. For each day with `overnightStopPoint`, run category retrieval serially:
   - hostel types
   - guesthouse types
   - hotel types
3. Normalize candidate values to `priceCny` (nightly total) and numeric `rating`.
4. Apply strict filters and ranking (`distance -> rating -> price`).
5. If category empty, apply fallback stages:
   - stage 1: radius expansion (12km, then 20km)
   - stage 2: price cap relaxation (+20%, keep hostel lower bound, keep rating floor)
6. Emit day-grouped output with per-item `policyStage` and day-level fallback trace.

### Module Responsibilities
- `src/map-provider/map-provider.port.ts`
  - Add lodging retrieval contract (`searchLodgingAround`).
- `src/map-provider/amap-lodging.adapter.ts` (new)
  - AMap POI around search with type whitelist, `sortrule=distance`, timeout, and mapped errors.
- `src/routing/lodging-policy.service.ts` (new)
  - Normalize candidate data, enforce category policies, apply staged fallback, and rank outputs.
- `src/routing/routing-orchestrator.service.ts`
  - Attach lodging recommendation result to each day stage when multi-day plan exists.
- `src/shared/validation/multiday-route-artifact.schema.ts`
  - Extend schemas to include lodging recommendation payload contract.

## Existing Codebase Patterns to Reuse

- Provider boundary pattern from `src/map-provider/map-provider.port.ts` and existing AMap adapters.
- Provider error classification from `src/map-provider/amap-error.mapper.ts`.
- Route/day-stage integration point from `src/routing/routing-orchestrator.service.ts` and
  `src/routing/day-stage-splitter.service.ts`.
- Zod artifact validation pattern from `src/shared/validation/*.schema.ts`.

## Policy Data Contract Recommendations

### Candidate Input (provider -> policy)
- `providerId`, `name`, `typeCode`, `distanceMeters`, `rating`, `priceCny`, `rawPolicyStage`.

### Output Entry (policy -> orchestration)
- `name`
- `type` (hostel | guesthouse | hotel)
- `distanceMeters`
- `rating`
- `priceCny`
- `policyStage` (strict | radius_12km | radius_20km | price_relaxed_20)

### Day-level Output
- `dayIndex`
- `overnightStopPoint`
- `categories.hostel[]`
- `categories.guesthouse[]`
- `categories.hotel[]`
- `fallbackTrace[]`
- `policyStatus` (compliant | relaxed | no_match)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider price/rating fields missing or non-numeric | False policy failures or invalid sorting | Centralize normalization and drop invalid records with trace reason. |
| Too many provider calls across categories and fallback stages | Latency spikes and quota pressure | Serial category execution, 3s timeout, no retry, and 10-minute same-session cache. |
| Duplicate POIs across category type lists | Inflated choices and ranking noise | De-duplicate by `providerId` before ranking. |
| Fallback behavior not auditable | Hard to explain recommendation quality | Persist day-level fallback trace and item-level `policyStage`. |
| Single-day behavior regression | Unexpected lodging output shape | Keep explicit guard: skip lodging retrieval when no overnight stop exists. |

## Edge Cases to Cover

- `overnightStopPoint` is `null` on final day or single-day plans.
- Provider returns empty list for one or more categories.
- Provider returns mixed currency/price formats requiring normalization fail-safe.
- Only relaxed stage produces candidates.
- No candidates after all fallback stages.
- Provider throws mapped fallback error during any category stage.

## Validation Architecture

### Test Layers
- Unit tests:
  - policy normalization and category filter correctness (`LODG-02`, `LODG-03`, `LODG-04`)
  - fallback stage transition behavior and no-match terminal status (`LODG-05`)
  - ranking and quota enforcement per category
- Integration tests:
  - orchestrator + lodging pipeline on multi-day route plan (`LODG-01`)
  - no retrieval on single-day route path
  - mapped provider failure produces stable fallback response
- Schema validation tests:
  - extended multiday artifact schema accepts valid lodging payload
  - rejects malformed lodging entries (missing rating/price/stage fields)

### Required New Tests
- `tests/routing/lodging-policy.service.test.ts`
- `tests/map-provider/amap-lodging.adapter.test.ts`
- `tests/routing/lodging-integration.test.ts`
- `tests/shared/validation/multiday-lodging-artifact.schema.test.ts`

### Verification Commands
- `pnpm vitest run tests/routing/lodging-policy.service.test.ts -t "LODG"`
- `pnpm vitest run tests/map-provider/amap-lodging.adapter.test.ts`
- `pnpm vitest run tests/routing/lodging-integration.test.ts`
- `pnpm vitest run tests/shared/validation/multiday-lodging-artifact.schema.test.ts`

## Planning Recommendation

Split Phase 4 into three executable plans:
1. Provider and schema foundations for lodging retrieval and day-level payload fields.
2. Policy engine (strict filters, ranking, fallback stages, no-match handling).
3. Orchestrator integration and requirement-focused verification coverage for `LODG-01..05`.
