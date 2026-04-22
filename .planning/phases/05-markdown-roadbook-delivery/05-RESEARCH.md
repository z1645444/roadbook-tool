# Phase 5: Markdown Roadbook Delivery - Research

**Researched:** 2026-04-22
**Domain:** Deterministic Markdown rendering of day-grouped cycling plans from canonical artifacts
**Confidence:** HIGH

<user_constraints>
## User Constraints (from current artifacts; no Phase 5 CONTEXT.md present)

### Locked Decisions
- Output must be a Markdown roadbook grouped by day (`BOOK-01`). [VERIFIED: .planning/REQUIREMENTS.md]
- Each day must include route overview, distance, estimated ride time, and waypoint sequence (`BOOK-02`). [VERIFIED: .planning/REQUIREMENTS.md]
- Each relevant day must include lodging shortlist with score/price details (`BOOK-03`). [VERIFIED: .planning/REQUIREMENTS.md]
- Output must include assumptions and constraint summary (`BOOK-04`). [VERIFIED: .planning/REQUIREMENTS.md]
- v1 remains chat-skill only and AMap-first. [VERIFIED: .planning/PROJECT.md]
- Canonical machine-readable model remains source of truth; user text output is projection (`RELY-02`). [VERIFIED: .planning/REQUIREMENTS.md]
- User-facing content should be Simplified Chinese. [VERIFIED: AGENTS.md]

### Claude's Discretion
- Roadbook renderer module naming and boundaries (service vs pure function). [ASSUMED]
- API response contract strategy (`roadbookMarkdown` additive field vs replacement of existing fields). [ASSUMED]
- Markdown layout details (heading depth, table vs list for lodging, assumptions block style). [ASSUMED]
- Test split between unit renderer tests and controller integration tests. [ASSUMED]

### Deferred Ideas (OUT OF SCOPE)
- Web UI and standalone CLI delivery for v1. [VERIFIED: .planning/PROJECT.md]
- OTA booking/payment workflows. [VERIFIED: .planning/REQUIREMENTS.md]
- Global multi-provider parity beyond AMap in v1. [VERIFIED: .planning/PROJECT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOOK-01 | Markdown roadbook grouped by day. [VERIFIED: .planning/REQUIREMENTS.md] | Add deterministic renderer that iterates `routePlan[]` day blocks from orchestrator output. [VERIFIED: src/routing/routing-orchestrator.service.ts] [ASSUMED] |
| BOOK-02 | Day overview includes route info + waypoint sequence. [VERIFIED: .planning/REQUIREMENTS.md] | Derive totals from existing `totalDistanceMeters/totalDurationSeconds` and derive waypoint chain from day `segments`. [VERIFIED: src/conversation/intake.controller.ts] [VERIFIED: src/shared/validation/route-artifact.schema.ts] [ASSUMED] |
| BOOK-03 | Include lodging shortlist with score/price details. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse `routePlan[n].lodging.categories` payload added in Phase 4. [VERIFIED: src/conversation/intake.controller.ts] [VERIFIED: tests/routing/lodging-integration.test.ts] |
| BOOK-04 | Include assumptions + constraint summary for validation. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse recap/assumption projection from canonical draft and include route metadata context in markdown footer. [VERIFIED: src/recap/recap-projection.service.ts] [VERIFIED: src/conversation/intake.controller.ts] [ASSUMED] |
</phase_requirements>

## Summary

Phase 5 should be implemented as a pure rendering layer on top of existing canonical routing
artifacts, not a new planning pipeline. `RoutingOrchestratorService` already emits day-grouped
`routePlan[]` with per-day totals, boundary points, and lodging payloads when applicable; this is
the correct render input boundary. [VERIFIED: src/routing/routing-orchestrator.service.ts]
[VERIFIED: src/shared/validation/multiday-route-artifact.schema.ts]

Current response shape already carries `recap`, `routePlan`, `routingStatus`, and `routeMetadata`,
but no markdown field. Phase 5 should add markdown generation in the controller-ready path while
preserving structured fields for regression stability and downstream machine use. [VERIFIED:
src/conversation/intake.controller.ts] [VERIFIED:
tests/conversation/intake-confirmation.test.ts] [ASSUMED]

**Primary recommendation:** Add a deterministic `roadbookMarkdown` projection in the
`routing_ready` path, sourced only from canonical recap + routePlan + lodging payload + metadata.
[VERIFIED: src/conversation/intake.controller.ts] [ASSUMED]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Markdown roadbook generation | API / Backend [ASSUMED] | — | Chat API already composes recap + route plan and returns final response payload. [VERIFIED: src/conversation/intake.controller.ts] |
| Day grouping and stage boundaries | API / Backend [ASSUMED] | — | Day partitioning is produced by orchestrator/splitter, not by client formatting. [VERIFIED: src/routing/routing-orchestrator.service.ts] [VERIFIED: src/routing/day-stage-splitter.service.ts] |
| Lodging shortlist embedding | API / Backend [ASSUMED] | — | Lodging payload already attached to each day at orchestration layer. [VERIFIED: src/routing/routing-orchestrator.service.ts] [VERIFIED: tests/routing/lodging-integration.test.ts] |
| Constraint summary + assumptions | API / Backend [ASSUMED] | — | Assumptions and correction markers already originate from canonical recap services. [VERIFIED: src/recap/recap-projection.service.ts] [VERIFIED: src/conversation/slot-resolver.service.ts] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3 [VERIFIED: package.json] | Implement deterministic markdown renderer and DTO contracts. [ASSUMED] | Existing project language and test/tooling baseline. [VERIFIED: package.json] |
| NestJS controller/service pattern | 11.1.19 [VERIFIED: package.json] | Wire renderer into `IntakeController` routing-ready response path. [ASSUMED] | Existing integration pattern for prior phases. [VERIFIED: src/conversation/intake.controller.ts] |
| zod | 4.3.6 [VERIFIED: package.json] | Validate renderer input/output shape if a dedicated schema is introduced. [ASSUMED] | Existing artifact-boundary validation pattern. [VERIFIED: src/shared/validation/multiday-route-artifact.schema.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.4 [VERIFIED: package.json] | Unit/integration regression for BOOK-01..04. [ASSUMED] | Renderer format invariants and controller response assertions. [ASSUMED] |
| Existing recap projection service | local module [VERIFIED: src/recap/recap-projection.service.ts] | Source of assumptions/correction context for BOOK-04 text section. [ASSUMED] | When creating assumptions/constraints markdown block. [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure TypeScript string renderer [ASSUMED] | External markdown templating libs [ASSUMED] | Extra dependency and template indirection without clear v1 value; deterministic local formatter is simpler to test. [ASSUMED] |

**Installation:** No new dependency is required for Phase 5 baseline implementation. [ASSUMED]

**Version verification:** Project-pinned versions verified from `package.json`; runtime tools
verified locally (`node v22.18.0`, `pnpm 10.32.1`, `vitest 4.1.4`). [VERIFIED: package.json]
[VERIFIED: command output node/pnpm/vitest versions]

## Architecture Direction for Markdown Roadbook Generation

### System Architecture Diagram

```text
POST /conversation/intake/turn
        |
        v
IntakeController.processTurn
        |
        +--> Slot/confirmation gating (need_slot / need_clarification) -> return no roadbook
        |
        v (ready_for_confirmation)
RoutingOrchestratorService.planRouteForSession
        |
        +--> routePlan[] (days, segments, totals, lodging, boundaries)
        +--> routeMetadata
        |
        v
MarkdownRoadbookRenderer (new, deterministic projection)
        |
        +--> constraints+assumptions section (from recap/canonical draft)
        +--> per-day route section
        +--> lodging section for overnight days
        +--> validation context footer
        |
        v
IntakeTurnResponse { routePlan, recap, routeMetadata, roadbookMarkdown }
```

### Recommended Project Structure
```text
src/
├── conversation/
│   └── intake.controller.ts          # Compose routing output + markdown projection
├── roadbook/                         # New module for markdown formatting
│   ├── markdown-roadbook.renderer.ts # Pure render function/service
│   └── roadbook-formatters.ts        # Distance/time/waypoint formatting helpers
└── shared/validation/
    └── roadbook-render.schema.ts     # Optional render-input contract guard
```

## Module/File Responsibilities in This Codebase

| File | Responsibility in Phase 5 | Status |
|------|----------------------------|--------|
| `src/conversation/intake.controller.ts` | Add `roadbookMarkdown` in `routing_ready` branch; keep existing fields unchanged. [VERIFIED: src/conversation/intake.controller.ts] [ASSUMED] | Modify |
| `src/routing/routing-orchestrator.service.ts` | Remains authoritative producer of day-grouped route/lodging artifacts; avoid markdown logic here. [VERIFIED: src/routing/routing-orchestrator.service.ts] [ASSUMED] | Reuse |
| `src/recap/recap-projection.service.ts` | Reuse for assumption/correction phrasing and constraint summary basis. [VERIFIED: src/recap/recap-projection.service.ts] [ASSUMED] | Reuse |
| `src/shared/validation/multiday-route-artifact.schema.ts` | Existing contract for day payload completeness; renderer must conform to this structure. [VERIFIED: src/shared/validation/multiday-route-artifact.schema.ts] [ASSUMED] | Reuse |
| `src/roadbook/markdown-roadbook.renderer.ts` | Deterministic markdown projection for BOOK-01..04. [ASSUMED] | New |
| `tests/roadbook/markdown-roadbook.renderer.test.ts` | BOOK-01..04 renderer unit coverage with fixed fixtures. [ASSUMED] | New |
| `tests/conversation/intake-confirmation.test.ts` | Route-ready integration assertion that markdown is returned and consistent with routePlan data. [VERIFIED: tests/conversation/intake-confirmation.test.ts] [ASSUMED] | Extend |

## Existing Patterns to Reuse from Prior Phases

- Extend controller response contract additively instead of replacing existing fields (used in
  Phase 3 and Phase 4). [VERIFIED: .planning/phases/03-multi-day-optimization-and-stage-split/03-03-PLAN.md]
  [VERIFIED: .planning/phases/04-lodging-recommendation-policy/04-03-PLAN.md]
- Keep orchestration logic data-centric and defer user formatting to projection layer. [VERIFIED:
  src/routing/routing-orchestrator.service.ts] [VERIFIED: src/recap/recap-projection.service.ts]
- Validate artifact boundaries with zod before user-facing rendering. [VERIFIED:
  src/shared/validation/multiday-route-artifact.schema.ts]
- Maintain deterministic tests with explicit requirement IDs in test names. [VERIFIED:
  tests/routing/lodging-integration.test.ts] [VERIFIED:
  tests/routing/phase3-multiday-integration.test.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Render-input trust | Ad-hoc unchecked object traversal | Existing zod artifact schemas (and optional dedicated render schema) | Prevents silent markdown corruption from missing fields. [VERIFIED: src/shared/validation/multiday-route-artifact.schema.ts] [ASSUMED] |
| Assumption text logic | Separate assumption parser/engine | Existing recap projection and `assumptions` fields | Avoids duplicated business wording and drift. [VERIFIED: src/recap/recap-projection.service.ts] [VERIFIED: src/conversation/slot-resolver.service.ts] |
| Lodging policy summaries | Recompute filters in renderer | Reuse `routePlan[n].lodging` pre-filtered output | Policy already resolved in Phase 4 service; renderer should only format. [VERIFIED: src/routing/lodging-policy.service.ts] [VERIFIED: src/routing/routing-orchestrator.service.ts] |

**Key insight:** Phase 5 is a projection phase; custom logic should be formatting-only, not
replanning/re-filtering. [ASSUMED]

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Waypoint sequence rendered incorrectly from segments | BOOK-02 failure despite correct route computation | Add deterministic waypoint-chain helper (`start + each segment.to`) with dedupe by `providerId`; unit-test with multiday fixtures. [VERIFIED: src/shared/validation/route-artifact.schema.ts] [ASSUMED] |
| Missing assumptions/constraint context in final markdown | BOOK-04 fails user validation goal | Build summary block from canonical recap + assumptions and include correction path text. [VERIFIED: src/recap/recap-projection.service.ts] [ASSUMED] |
| Single-day output incorrectly shows lodging shortlist | BOOK-03 behavioral regression | Respect `overnightStopPoint === null` and `lodging === null` handling already present in route plan. [VERIFIED: src/routing/routing-orchestrator.service.ts] [VERIFIED: tests/routing/lodging-integration.test.ts] |
| Markdown unstable due null score/price | Broken readability and inconsistent output | Explicitly format nulls as `未知`/`N/A` in renderer helpers. [VERIFIED: src/map-provider/map-provider.port.ts] [ASSUMED] |
| Contract drift between markdown and structured payload | Hard-to-debug user mismatches | Add integration assertion that markdown day count equals `routePlan.length`. [VERIFIED: tests/conversation/intake-confirmation.test.ts] [ASSUMED] |

## Edge Cases

- `tripDays=1`: render one day and explicitly indicate no overnight lodging section. [VERIFIED:
  src/routing/routing-orchestrator.service.ts] [VERIFIED:
  tests/routing/lodging-integration.test.ts] [ASSUMED]
- Final multiday day has `overnightStopPoint=null`; lodging section should be omitted for that day.
  [VERIFIED: src/routing/day-stage-splitter.service.ts] [VERIFIED:
  tests/routing/phase3-multiday-integration.test.ts]
- `lodging.policyStatus='no_match'`: include fallback trace for explainability. [VERIFIED:
  src/routing/lodging-policy.service.ts] [VERIFIED:
  tests/routing/lodging-integration.test.ts]
- Ambiguous/clarification/fallback routing statuses should not attempt markdown rendering. [VERIFIED:
  src/conversation/intake.controller.ts] [ASSUMED]
- User/provider text may contain markdown control characters; escape before rendering. [ASSUMED]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 [VERIFIED: package.json] |
| Config file | `vitest.config.ts` [VERIFIED: vitest.config.ts] |
| Quick run command | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts tests/conversation/intake-confirmation.test.ts -t "BOOK"` [ASSUMED] |
| Full suite command | `pnpm vitest run` [VERIFIED: package.json] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Markdown grouped by day sections. [VERIFIED: .planning/REQUIREMENTS.md] | unit + integration [ASSUMED] | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts -t "BOOK-01"` [ASSUMED] | ❌ Wave 0 |
| BOOK-02 | Day route overview + totals + waypoint sequence. [VERIFIED: .planning/REQUIREMENTS.md] | unit [ASSUMED] | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts -t "BOOK-02"` [ASSUMED] | ❌ Wave 0 |
| BOOK-03 | Lodging shortlist details on relevant days. [VERIFIED: .planning/REQUIREMENTS.md] | unit + integration [ASSUMED] | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts tests/conversation/intake-confirmation.test.ts -t "BOOK-03"` [ASSUMED] | ❌ Wave 0 |
| BOOK-04 | Assumptions + constraint summary + validation context. [VERIFIED: .planning/REQUIREMENTS.md] | unit + integration [ASSUMED] | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts tests/conversation/intake-confirmation.test.ts -t "BOOK-04"` [ASSUMED] | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts tests/conversation/intake-confirmation.test.ts -t "BOOK"` [ASSUMED]
- **Per wave merge:** `pnpm vitest run tests/conversation tests/routing --reporter=dot` [ASSUMED]
- **Phase gate:** `pnpm vitest run` full suite green before `/gsd-verify-work`. [VERIFIED: package.json] [ASSUMED]

### Wave 0 Gaps
- [ ] `tests/roadbook/markdown-roadbook.renderer.test.ts` - requirement-focused renderer assertions for BOOK-01..04. [ASSUMED]
- [ ] `tests/conversation/intake-confirmation.test.ts` - route-ready response assertions for `roadbookMarkdown`. [VERIFIED: tests/conversation/intake-confirmation.test.ts] [ASSUMED]
- [ ] `src/roadbook/markdown-roadbook.renderer.ts` - implementation target for deterministic projection. [ASSUMED]

## Planning Recommendation Split into Executable Plans

1. **05-01: Roadbook Renderer Foundation**
   - Build `src/roadbook/markdown-roadbook.renderer.ts` with deterministic helpers for distance,
     duration, waypoint sequence, and markdown escaping. [ASSUMED]
   - Inputs: `routePlan`, recap summary/assumptions, route metadata. [VERIFIED:
     src/conversation/intake.controller.ts] [ASSUMED]
   - Verification: renderer unit tests for BOOK-01/02 baseline sections. [ASSUMED]
2. **05-02: Controller Integration and Contract Update**
   - Extend `IntakeTurnResponse` with additive `roadbookMarkdown: string | null`. [ASSUMED]
   - Render only on `routingStatus='ready'`; keep fallback/clarification unchanged. [VERIFIED:
     src/conversation/intake.controller.ts] [ASSUMED]
   - Verification: integration assertions in `tests/conversation/intake-confirmation.test.ts`.
     [VERIFIED: tests/conversation/intake-confirmation.test.ts] [ASSUMED]
3. **05-03: Requirement Hardening and Regression Coverage**
   - Add BOOK-03/04 focused tests (lodging shortlist formatting, assumptions/constraint section,
     metadata/validation context). [ASSUMED]
   - Add guard assertions for single-day no-lodging wording and `no_match` fallback trace display.
     [VERIFIED: tests/routing/lodging-integration.test.ts] [ASSUMED]
   - Verification: targeted BOOK suite + full `pnpm vitest run`. [VERIFIED: package.json]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test/render execution | ✓ | v22.18.0 [VERIFIED: command output node/pnpm/vitest versions] | Use project-pinned runtime manager if strict Node 24 is enforced. [ASSUMED] |
| pnpm | Test commands and dependency workflow | ✓ | 10.32.1 [VERIFIED: command output node/pnpm/vitest versions] | npm scripts can run tests if needed. [VERIFIED: package.json] [ASSUMED] |
| Vitest CLI | Validation architecture | ✓ | 4.1.4 [VERIFIED: command output node/pnpm/vitest versions] | `pnpm test` as wrapper command. [VERIFIED: package.json] |

**Missing dependencies with no fallback:** None identified for this phase. [VERIFIED: command
output node/pnpm/vitest versions] [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [ASSUMED] | Not in phase scope (formatting/output only). [ASSUMED] |
| V3 Session Management | no [ASSUMED] | Not in phase scope (no session-layer changes planned). [ASSUMED] |
| V4 Access Control | no [ASSUMED] | No new authorization boundary introduced by markdown renderer. [ASSUMED] |
| V5 Input Validation | yes [ASSUMED] | Keep DTO validation + optional render-input schema before formatting. [VERIFIED: src/main.ts] [VERIFIED: src/shared/validation/multiday-route-artifact.schema.ts] [ASSUMED] |
| V6 Cryptography | no [ASSUMED] | No cryptographic behavior added in this phase. [ASSUMED] |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Markdown injection via unescaped names/notes | Tampering | Escape markdown-reserved chars in renderer helper before composing sections. [ASSUMED] |
| Untrusted provider text propagated to user output | Information Disclosure | Whitelist rendered fields and avoid raw provider payload dumps. [VERIFIED: src/map-provider/map-provider.port.ts] [ASSUMED] |
| Contract drift between structured and markdown outputs | Repudiation | Test markdown assertions against `routePlan` fixture source in same integration case. [VERIFIED: tests/conversation/intake-confirmation.test.ts] [ASSUMED] |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Structured route payload only, no final markdown output. [VERIFIED: src/conversation/intake.controller.ts] | Deterministic markdown projection from canonical artifacts for chat delivery. [ASSUMED] | Planned in Phase 5 roadmap scope. [VERIFIED: .planning/ROADMAP.md] | Meets BOOK-01..04 user-facing completeness requirements. [VERIFIED: .planning/REQUIREMENTS.md] [ASSUMED] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Additive `roadbookMarkdown` field is preferred over replacing existing response fields. | Planning Recommendation | API contract may diverge from planner/user expectation. |
| A2 | No external markdown library is needed for v1 quality bar. | Standard Stack | Rework may be needed if formatting complexity expands. |
| A3 | BOOK tests should be split into new `tests/roadbook/*` + existing controller integration suite. | Validation Architecture | Test organization could mismatch team preference. |
| A4 | Renderer should explicitly escape markdown control characters in user/provider strings. | Risks / Security Domain | Unescaped content may break rendering in downstream clients. |

## Open Questions (RESOLVED)

1. **Should markdown be the primary user field or an additional field alongside `routePlan`?**
   - What we know: Existing consumers/tests already rely on structured `routePlan`. [VERIFIED:
     tests/conversation/intake-confirmation.test.ts]
   - Resolution: Use additive contract in Phase 5 with `roadbookMarkdown` alongside `routePlan`
     to avoid breaking existing consumers; replacement can be considered in a dedicated future
     contract phase. [ASSUMED]
2. **Should BOOK-04 constraints section use slot-resolver recap or full canonical recap projection?**
   - What we know: `slot-resolver` recap is lightweight, while recap projection service includes
     correction path and richer detail. [VERIFIED: src/conversation/slot-resolver.service.ts]
     [VERIFIED: src/recap/recap-projection.service.ts]
   - Resolution: Use canonical recap projection text as the primary source for the constraint
     summary section, and retain slot-level cues only as secondary phrasing hints. [ASSUMED]

## Sources

### Primary (HIGH confidence)
- `.planning/REQUIREMENTS.md` - BOOK-01..04 contracts and RELY-02 baseline.
- `.planning/ROADMAP.md` - Phase 5 goal/success criteria and dependency chain.
- `.planning/PROJECT.md` - v1 constraints (chat-first, AMap-first, markdown output).
- `AGENTS.md` - project behavior constraints (including user-facing language guidance).
- `src/conversation/intake.controller.ts` - current response contract and routing-ready/fallback branches.
- `src/routing/routing-orchestrator.service.ts` - authoritative day-level route/lodging payload source.
- `src/shared/validation/multiday-route-artifact.schema.ts` - day/lodging contract schema.
- `src/routing/day-stage-splitter.service.ts` - day boundary and overnight semantics.
- `src/recap/recap-projection.service.ts` and `src/conversation/slot-resolver.service.ts` - assumptions/recap generation paths.
- `tests/conversation/intake-confirmation.test.ts` and `tests/routing/lodging-integration.test.ts` - established integration/test patterns.
- `package.json`, `vitest.config.ts`, `.planning/config.json` - tooling and workflow validation config.
- Local environment command checks (`node --version`, `pnpm --version`, `pnpm vitest --version`).

### Secondary (MEDIUM confidence)
- `.planning/phases/03-multi-day-optimization-and-stage-split/03-03-PLAN.md` - contract extension pattern.
- `.planning/phases/04-lodging-recommendation-policy/04-03-PLAN.md` - additive controller/orchestrator integration pattern.
- `.planning/phases/04-lodging-recommendation-policy/04-CONTEXT.md` - prior phase output assumptions toward markdown.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - grounded in project-pinned dependencies and current tool outputs.
- Architecture: HIGH - derived from existing route/day/lodging controller contracts.
- Pitfalls: MEDIUM - mitigations are solid but final markdown contract details remain partially assumed.

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days; mostly stable local architecture)
