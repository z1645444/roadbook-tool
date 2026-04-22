# Phase 6: Split roadbook tool into reusable skill - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract a reusable skill-facing planning entry from the current app-oriented runtime without
regressing existing behavior of the `conversation/intake` API.

This phase covers contract extraction, boundary separation, and compatibility wiring.
It does not include new route algorithms, new map providers, or UI changes.

</domain>

<decisions>
## Implementation Decisions

### Skill Contract
- **D-01:** Define a stable skill input/output contract for planning execution that can be invoked
  without Nest controller context.
- **D-02:** Expose structured status outcomes (`ready`, `needs_clarification`, `fallback`) as
  first-class skill outputs.
- **D-03:** Keep `routePlan`, `routeMetadata`, and `roadbookMarkdown` semantics aligned with
  current v1 response behavior.

### Core vs Runtime Separation
- **D-04:** Move orchestration and projection logic into a core entry module that does not depend
  on Nest decorators or HTTP DTO classes.
- **D-05:** Keep transport/controller concerns in `conversation/intake.controller.ts` and adapt it
  to call the new core skill entry.
- **D-06:** Preserve provider and repository boundaries through existing interfaces
  (`MapProvider`, `ConstraintDraftRepository`).

### Compatibility and Rollout
- **D-07:** Maintain backward compatibility for current intake endpoint output shape.
- **D-08:** Add focused tests that compare app-driven output and skill-driven output for equivalent
  inputs.
- **D-09:** Keep current app runtime as reference implementation while new skill entry becomes the
  primary reusable integration surface.

### the agent's Discretion
- Internal folder layout for the new skill/core modules.
- Naming of adapter helpers and mapper functions.
- Exact unit vs integration test split, as long as parity is provable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and Scope
- `.planning/PROJECT.md` - Current product constraints and v1 completion state.
- `.planning/ROADMAP.md` - Phase sequencing and dependency relation.
- `.planning/todos/pending/2026-04-22-split-roadbook-tool-into-reusable-skill.md` - Originating
  problem statement and intended split direction.

### Runtime Entry and Planning Core
- `src/conversation/intake.controller.ts` - Current API entry and response shaping.
- `src/routing/routing-orchestrator.service.ts` - Current planning orchestration and fallback flow.
- `src/roadbook/markdown-roadbook.renderer.ts` - Current markdown projection behavior.
- `src/app.module.ts` - DI wiring for app runtime composition.

</canonical_refs>

<specifics>
## Specific Ideas

- Introduce a `planRoadbookSkill()` style core entry under `src/skill/` or `src/core/`.
- Normalize app inputs into skill contract at adapter boundary, not inside core engine.
- Keep skill output serializable and transport-agnostic so OpenClaw/other agents can invoke it.
- Include explicit error taxonomy for integration reliability.

</specifics>

<deferred>
## Deferred Ideas

- Provider abstraction extension beyond AMap.
- GPX/TCX export and weather-aware replanning.
- Packaging as a separate npm module (can follow once contract stabilizes).

</deferred>

---

*Phase: 06-split-roadbook-tool-into-reusable-skill*
*Context gathered: 2026-04-22*
