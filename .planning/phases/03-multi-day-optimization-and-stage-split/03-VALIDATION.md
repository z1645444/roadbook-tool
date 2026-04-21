---
phase: 3
slug: multi-day-optimization-and-stage-split
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 3 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run tests/routing --reporter=dot` |
| Full suite command | `pnpm vitest run` |
| Estimated runtime | 30-120 seconds |

## Sampling Rate

- After every task commit: `pnpm vitest run tests/routing --reporter=dot`
- After every wave: `pnpm vitest run`
- Before verification: full suite must be green
- Max feedback latency: 120 seconds

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | ROUT-03 | T-3-01 | Intermediate waypoints are reordered deterministically while preserving start/end points | unit | `pnpm vitest run tests/routing/waypoint-optimization.test.ts -t "ROUT-03"` | no | pending |
| 3-02-01 | 02 | 2 | ROUT-04 | T-3-02 | Multi-day stage split enforces ride window and intensity caps with explicit boundaries | unit | `pnpm vitest run tests/routing/day-stage-split.test.ts -t "ROUT-04"` | no | pending |
| 3-03-01 | 03 | 3 | ROUT-03, ROUT-04 | T-3-03 | Orchestrator output exposes optimized sequence and per-day boundaries without regressing one-day flow | integration | `pnpm vitest run tests/routing/phase3-multiday-integration.test.ts` | no | pending |

## Wave 0 Requirements

- [ ] `tests/routing/waypoint-optimization.test.ts` created and passing.
- [ ] `tests/routing/day-stage-split.test.ts` created and passing.
- [ ] `tests/routing/phase3-multiday-integration.test.ts` created and passing.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Instructions |
|----------|-------------|------------|--------------|
| Multi-day boundary readability for chat users | ROUT-04 | Readability and clarity are hard to enforce via assertions only | Review generated route output and confirm each day clearly shows start, end, and overnight stop |

## Validation Sign-Off

- [ ] All tasks include automated verification or Wave 0 dependencies.
- [ ] No three consecutive tasks without automated checks.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags in verification commands.
- [ ] Feedback latency under 120 seconds.
- [ ] `nyquist_compliant: true` set before phase closeout.

