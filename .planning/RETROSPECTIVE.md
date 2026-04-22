# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — milestone

**Shipped:** 2026-04-22
**Phases:** 5 | **Plans:** 16 | **Sessions:** n/a

### What Was Built
- Built deterministic chat intake with canonical constraint persistence and recap projection.
- Delivered AMap-backed routing with fallback taxonomy and reproducibility metadata.
- Added waypoint optimization and day-stage splitting for multi-day roadbooks.
- Implemented lodging policy with strict filters, staged fallback, and deterministic trace output.
- Delivered day-grouped Markdown roadbook rendering integrated into routing-ready responses.

### What Worked
- Phase-by-phase requirement tagging kept traceability stable from plan to verification.
- Deterministic contracts and targeted regression suites prevented behavior drift while adding features.

### What Was Inefficient
- Some summary/verification timing and metrics fields remained placeholder quality (`-` duration values).
- Milestone close currently mixes multiple tools (`gsd-sdk` + `gsd-tools`) and has signature inconsistencies.

### Patterns Established
- Use schema validation at every external/provider boundary before mutating canonical state.
- Keep user-facing fallback messaging category-driven and deterministic.
- Treat Markdown output as a pure projection from canonical artifacts.

### Key Lessons
1. Requirement-ID-labeled tests per phase make milestone-close audits straightforward and objective.
2. Deterministic fallback traces are valuable both for user trust and debugging failed external calls.

### Cost Observations
- Model mix: n/a
- Sessions: n/a
- Notable: Most implementation effort went into integration reliability and deterministic output contracts.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | n/a | 5 | Established end-to-end deterministic planning and verification discipline |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 39 passing tests in Phase 5 regression suite (`tests/roadbook tests/conversation tests/routing`) | n/a | 0 |

### Top Lessons (Verified Across Milestones)

1. Keep external-provider errors normalized into domain fallbacks before controller boundaries.
2. Preserve canonical model as source of truth and derive all user-facing summaries from projections.
