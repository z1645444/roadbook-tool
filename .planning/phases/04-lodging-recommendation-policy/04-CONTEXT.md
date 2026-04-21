# Phase 4: Lodging Recommendation Policy - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver policy-compliant lodging recommendations near nightly stop points produced by the existing
multi-day routing flow. The phase covers candidate retrieval, strict quality/price filtering,
controlled fallback behavior, and chat-ready comparison output.

This phase does not include booking/payment, map UI, or single-day end-point lodging retrieval.

</domain>

<decisions>
## Implementation Decisions

### Lodging Candidate Retrieval Policy
- **D-01:** Use `overnightStopPoint` as the only retrieval anchor for each day.
- **D-02:** Do not run lodging retrieval for single-day plans without nightly stops.
- **D-03:** Use initial search radius `8km`.
- **D-04:** Use `sortrule=distance` for candidate retrieval.
- **D-05:** Limit retrieval to at most 2 pages per type, then truncate by policy quota.
- **D-06:** Keep at most 3 candidates per lodging type per day after filtering.
- **D-07:** Execute hostel/guesthouse/hotel retrieval in serial order.
- **D-08:** De-duplicate candidates by `providerId`.
- **D-09:** Extend `MapProvider` with lodging search capability rather than calling AMap directly
  in orchestrators.
- **D-10:** Use fixed AMap `types` whitelists (no keyword-only retrieval mode).
- **D-11:** Apply per-query timeout of 3 seconds and no retry.
- **D-12:** Cache same-session same-anchor lodging POI results for 10 minutes.

### Policy Filtering and Ranking
- **D-13:** Normalize comparison to nightly total price in CNY.
- **D-14:** Enforce strict `rating >= 4.0` baseline for all three lodging categories.
- **D-15:** Keep current policy thresholds:
  - Hostel: `40-100 CNY`, rating `>= 4.0`
  - Guesthouse: `<= 200 CNY`, rating `>= 4.0`
  - Hotel: `<= 200 CNY`, rating `>= 4.0`
- **D-16:** Rank within each category by distance first, rating second, price third.
- **D-17:** Keep fixed output quota per category (3 each), no cross-category slot stealing.

### Fallback Relaxation Strategy
- **D-18:** Fallback sequence is fixed: expand radius, then relax price cap.
- **D-19:** Radius expansion steps: `8km -> 12km -> 20km`.
- **D-20:** Price-cap relaxation step: `+20%` cap; hostel lower bound `40 CNY` remains fixed.
- **D-21:** Never relax rating threshold below `4.0`.
- **D-22:** If still empty after fallback, return explicit "no policy-compliant candidates" status.

### Output Contract and Comparison Format
- **D-23:** Group output by `Day N / overnight stop`.
- **D-24:** Minimal lodging entry fields are:
  `name, type, distanceMeters, rating, priceCny, policyStage`.
- **D-25:** Present three category sections per day, each listing top 3 by policy ranking.
- **D-26:** When fallback yields no result, include the applied relaxation trace in response.

### the agent's Discretion
- Exact cache key format and in-memory storage mechanism.
- AMap type-code mapping constants for each lodging category.
- Internal DTO/schema naming and module boundaries.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Requirement Contracts
- `.planning/ROADMAP.md` - Phase 4 goal, boundary, and success criteria.
- `.planning/REQUIREMENTS.md` - `LODG-01` through `LODG-05` requirement contracts.
- `.planning/PROJECT.md` - v1 AMap-first constraints and lodging policy thresholds.

### Existing Route-Day Integration Points
- `src/routing/day-stage-splitter.service.ts` - source of `overnightStopPoint` semantics.
- `src/routing/routing-orchestrator.service.ts` - current route planning orchestration shape.
- `src/shared/validation/multiday-route-artifact.schema.ts` - day-stage output structure.
- `src/shared/validation/route-artifact.schema.ts` - route point/segment schema contracts.

### Provider and Reliability Patterns
- `src/map-provider/map-provider.port.ts` - provider abstraction to extend for lodging search.
- `src/map-provider/amap-bicycling.adapter.ts` - established AMap adapter and error mapping style.
- `src/map-provider/amap-error.mapper.ts` - centralized provider error classification pattern.
- `src/reliability/routing-fallback.error.ts` - user-facing fallback category contract pattern.

### Additional Specs
- No additional external ADR/spec documents were referenced during this discussion session.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapProvider` abstraction already centralizes provider-facing capabilities.
- Existing AMap adapters define fetch, parse, and mapped-error handling patterns to reuse.
- Multi-day day-stage output already exposes nightly anchors via `overnightStopPoint`.

### Established Patterns
- Provider failures are translated into domain-safe fallback categories before surfacing to users.
- Route/domain payloads are validated with zod schemas at boundaries.
- Orchestrator layer composes provider calls and writes deterministic session artifacts.

### Integration Points
- Lodging retrieval should run after day-stage generation using each day anchor.
- Lodging policy result must attach to day-level plan payload for downstream markdown rendering.
- Fallback traces should align with existing user-safe reliability response conventions.

</code_context>

<specifics>
## Specific Ideas

- Use fixed category pipelines: hostel, guesthouse, hotel.
- Keep fallback auditable by recording each policy stage attempted.
- Keep chat output compact but comparable with fixed per-day category sections.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 04-lodging-recommendation-policy*
*Context gathered: 2026-04-21*
