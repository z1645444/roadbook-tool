# Roadmap: roadbook-tool

## Overview

This roadmap delivers a chat-first cyclist planning workflow from constraint capture to final
Markdown roadbook. Phases follow natural delivery boundaries in v1 requirements: intake, routing
baseline, multi-day optimization, lodging policy, then user-facing roadbook output.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Conversation Intake and Constraint Model** - Capture planning inputs in chat and
      persist a canonical itinerary draft.
- [x] **Phase 2: Routing Baseline and Reliability** - Produce reliable single-day routing with
      AMap error handling and reproducibility metadata.
- [x] **Phase 3: Multi-day Optimization and Stage Split** - Reorder waypoints and split
      multi-day routes under ride constraints.
- [x] **Phase 4: Lodging Recommendation Policy** - Add overnight lodging search with strict
      quality/price rules and fallback behavior.
- [x] **Phase 5: Markdown Roadbook Delivery** - Render complete day-grouped roadbook output with
      assumptions and validation context.

## Phase Details

### Phase 1: Conversation Intake and Constraint Model
**Goal**: Users can fully define trip constraints in chat and receive a consistent structured
planning draft.
**Depends on**: Nothing (first phase)
**Requirements**: CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, RELY-02
**Success Criteria** (what must be TRUE):
  1. User can provide origin and destination in chat and gets structured confirmation before route
     generation begins.
  2. User can provide one or more waypoints and sees them normalized as accepted route points.
  3. User can set date range, total trip days, daily ride window, and intensity profile, and the
     constraints are reflected back in the planning summary.
  4. User can revise any captured field and receive a consistent recap without losing previously
     accepted constraints.
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Bootstrap canonical constraint model and normalization/patch foundations.
- [x] 01-02-PLAN.md - Implement slot-driven intake, ambiguity blocking, and confirmation gate.
- [x] 01-03-PLAN.md - Wire canonical persistence and deterministic recap projection regression.

### Phase 2: Routing Baseline and Reliability
**Goal**: Users can generate dependable AMap-based cycling routes for accepted points in single-day
mode.
**Depends on**: Phase 1
**Requirements**: ROUT-01, ROUT-02, ROUT-05, RELY-01, RELY-03
**Success Criteria** (what must be TRUE):
  1. User is prompted to disambiguate location input when AMap geocoding is ambiguous, and only
     confirmed points are used.
  2. User receives cycling route segments between ordered route points generated from AMap
     bicycling APIs.
  3. User configuring a one-day trip receives a valid single-day plan instead of forced multi-day
     staging.
  4. User receives a clear fallback message when AMap quota/auth/rate errors occur, without
     silent failure.
  5. Operator can inspect route generation metadata (time/provider hash) tied to generated plans
     for reproducibility checks.
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md - Define provider contracts, geocode ambiguity handling, and ordered segment aggregation baselines.
- [x] 02-02-PLAN.md - Implement AMap adapters and centralized infocode fallback mapping for reliability.
- [x] 02-03-PLAN.md - Build single-day routing orchestrator with reproducibility metadata hashing and persistence.
- [x] 02-04-PLAN.md - Wire intake-to-routing integration and full Phase 2 requirement regression coverage.

### Phase 3: Multi-day Optimization and Stage Split
**Goal**: Users can obtain a feasible multi-day itinerary with optimized waypoint order and day
boundaries.
**Depends on**: Phase 2
**Requirements**: ROUT-03, ROUT-04
**Success Criteria** (what must be TRUE):
  1. User with multiple waypoints receives an optimized waypoint sequence that preserves start/end
     points.
  2. User planning multiple days gets day stages that satisfy selected intensity caps and daily
     time-window constraints.
  3. User can see explicit daily stage boundaries and overnight stop points in the generated plan.
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md - Build deterministic endpoint-preserving waypoint optimization core with runtime contract validation.
- [x] 03-02-PLAN.md - Implement daily stage splitting with intensity and ride-window hard constraints.
- [x] 03-03-PLAN.md - Integrate optimization and stage split into orchestration and chat response regression flow.

### Phase 4: Lodging Recommendation Policy
**Goal**: Users can view policy-compliant lodging options near nightly stops, with graceful
fallbacks in sparse areas.
**Depends on**: Phase 3
**Requirements**: LODG-01, LODG-02, LODG-03, LODG-04, LODG-05
**Success Criteria** (what must be TRUE):
  1. User gets nearby lodging candidates for each nightly stop point from AMap POI search.
  2. User sees hostel, guesthouse, and hotel options filtered by the defined rating and price
     rules.
  3. User sees a fallback recommendation strategy when strict filters return no candidates.
  4. User can compare shortlisted lodging entries with score and price details.
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md - Extend provider/schema contracts and implement AMap lodging adapter foundation.
- [x] 04-02-PLAN.md - Implement strict category policy filtering, ranking, and staged fallback engine.
- [x] 04-03-PLAN.md - Wire lodging policy into routing/controller flow and add phase integration regressions.

### Phase 5: Markdown Roadbook Delivery
**Goal**: Users receive an actionable Markdown roadbook that is easy to validate and execute.
**Depends on**: Phase 4
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04
**Success Criteria** (what must be TRUE):
  1. User receives final output as a Markdown roadbook grouped by day.
  2. User sees each day include route overview, distance, estimated ride time, and waypoint
     sequence.
  3. User sees lodging shortlists with score/price details on relevant overnight days.
  4. User can review assumptions and applied constraints in the output to validate plan
     correctness.
**Plans**: 3 plans

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Conversation Intake and Constraint Model | 3/3 | Complete | 2026-04-21 |
| 2. Routing Baseline and Reliability | 4/4 | Complete | 2026-04-21 |
| 3. Multi-day Optimization and Stage Split | 3/3 | Complete | 2026-04-21 |
| 4. Lodging Recommendation Policy | 3/3 | Complete | 2026-04-21 |
| 5. Markdown Roadbook Delivery | 3/3 | Complete | 2026-04-22 |
