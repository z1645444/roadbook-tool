---
phase: 02-routing-baseline-and-reliability
plan: 02
subsystem: api
tags: [amap, adapters, reliability, fallback, vitest]
requires:
  - phase: 02-routing-baseline-and-reliability
    provides: provider contracts and deterministic segment service from 02-01
provides:
  - amap geocode adapter behind map-provider contract
  - amap bicycling adapter behind map-provider contract
  - centralized infocode-to-fallback taxonomy with sanitized error surfaces
affects: [phase-02, routing, reliability]
tech-stack:
  added: []
  patterns: [adapter isolation for external APIs, centralized fallback classification]
key-files:
  created:
    - src/map-provider/amap-geocode.adapter.ts
    - src/map-provider/amap-bicycling.adapter.ts
    - src/map-provider/amap-error.mapper.ts
    - src/reliability/routing-fallback.error.ts
    - tests/reliability/amap-fallback-errors.test.ts
  modified: []
key-decisions:
  - "Keep provider endpoint failure handling centralized through mapAmapError."
  - "Expose only RoutingFallbackError to callers with safe Chinese fallback messages."
patterns-established:
  - "Adapters parse provider payloads into typed DTOs before returning."
  - "No raw API payload, key, url, or stack traces are exposed in user messages."
requirements-completed: [ROUT-01, ROUT-02, RELY-01]
duration: 18min
completed: 2026-04-21
---

# Phase 02 Plan 02 Summary

**AMap API integration is now adapterized with deterministic fallback taxonomy and sanitized user-safe failures.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-21T06:30:00Z
- **Completed:** 2026-04-21T06:48:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Implemented geocode and bicycling adapters against the shared provider contract.
- Added centralized infocode mapper and typed routing fallback error category model.
- Expanded RELY-01 tests to validate sanitizer guarantees for adapter failure paths.

## Task Commits

1. **Task 1: Implement AMap geocode and bicycling adapters against provider port** - `a82bfa3` (feat)
2. **Task 2: Add centralized AMap infocode mapper and typed fallback domain error** - `176a648` (feat)
3. **Task 3: Wire adapters to fallback mapper and enforce non-leaky error surfaces** - `3520487` (test)

## Files Created/Modified

- `src/map-provider/amap-geocode.adapter.ts` - Geocode adapter with typed candidate normalization.
- `src/map-provider/amap-bicycling.adapter.ts` - Bicycling adapter with typed segment normalization.
- `src/map-provider/amap-error.mapper.ts` - Deterministic infocode category mapping.
- `src/reliability/routing-fallback.error.ts` - Domain fallback error payload contract.
- `tests/reliability/amap-fallback-errors.test.ts` - RELY-01 taxonomy and sanitization regressions.

## Decisions Made

- Missing or invalid provider payloads are mapped to unknown/provider fallback instead of leaking internals.
- Retryability is category-driven (`auth_error`/`quota_error` non-retryable).

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Routing orchestrator can rely on stable adapter behavior and fallback error classes.
- Metadata and persistence work in 02-03 can consume categorized failure outputs directly.
