---
phase: 06-split-roadbook-tool-into-reusable-skill
plan: 01
subsystem: skill-core
tags: [skill, delegation, parity, intake]
requires:
  - phase: 05
    provides: intake routing + markdown delivery baseline
provides:
  - transport-agnostic skill input/output contract for roadbook planning
  - executable roadbook skill service for ready/clarification/fallback flows
  - intake controller delegation to skill service with parity regression coverage
affects: [conversation, routing, skill, tests]
tech-stack:
  added: []
  patterns: [controller-to-skill delegation, status-parity regression]
key-files:
  created:
    - src/skill/roadbook-skill.contract.ts
    - src/skill/roadbook-skill.types.ts
    - src/skill/roadbook-skill.service.ts
    - tests/skill/roadbook-skill.service.test.ts
    - tests/conversation/intake-skill-parity.test.ts
  modified:
    - src/conversation/intake.controller.ts
    - src/app.module.ts
key-decisions:
  - "Skill contract is status-discriminated (`ready|needs_clarification|fallback`) and transport-agnostic."
  - "Controller keeps API response shape while delegating confirmation-ready execution to `RoadbookSkillService`."
  - "Parity tests assert `routing_ready`, `need_clarification`, and `routing_fallback` behavior after delegation."
patterns-established:
  - "When DI is not wired in direct unit construction, controller builds a local skill-service fallback from existing orchestrator/repository dependencies to preserve test ergonomics."
requirements-completed: [TBD]
duration: 35min
completed: 2026-04-22
---

# Phase 06-01 Summary

**Extracted a reusable planning skill boundary and delegated intake ready-path execution to it without breaking existing API semantics.**

## Performance

- **Duration:** 35 min
- **Completed:** 2026-04-22
- **Tasks:** 3
- **Files changed:** 7 tracked code/test files + 1 summary

## Accomplishments

- Added explicit skill contract/types under `src/skill/` with canonical output fields:
  - `routePlan`
  - `routeMetadata`
  - `fallbackMessage`
  - `roadbookMarkdown`
- Implemented `RoadbookSkillService.execute()` to:
  - persist canonical draft
  - invoke `planRouteForSession`
  - map routing states into skill statuses
  - render markdown for ready state
- Refactored `IntakeController` ready branch to delegate into `RoadbookSkillService` while preserving existing response schema and status mapping.
- Registered `RoadbookSkillService` in `AppModule` providers.
- Added focused regression coverage:
  - `tests/skill/roadbook-skill.service.test.ts` (ready / needs_clarification / fallback)
  - `tests/conversation/intake-skill-parity.test.ts` (controller parity for routing_ready / need_clarification / routing_fallback)

## Validation

Executed and passed:

- `pnpm vitest run tests/skill/roadbook-skill.service.test.ts`
- `pnpm vitest run tests/conversation/intake-confirmation.test.ts tests/conversation/intake-skill-parity.test.ts`

## Deviations from Plan

- The fallback parity path uses `RoutingFallbackError` to exercise the existing orchestrator fallback contract, rather than forcing a generic thrown error path.
- Controller constructor now includes a local fallback instantiation path for `RoadbookSkillService` when tests instantiate controller manually without Nest DI.

## Issues Encountered

- Initial TDD red phase failed due to missing `roadbook-skill.service.ts` import target (expected).
- Resolved by implementing the service and re-running targeted suites.

## Next Phase Readiness

- Phase 06 now has an executable skill entry surface and parity guardrails.
- Ready for additional extraction work (module packaging/provider abstractions) in subsequent plans.
