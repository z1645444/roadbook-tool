---
phase: 1
slug: conversation-intake-and-constraint-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | `vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `pnpm vitest run tests/conversation --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~30-90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/conversation --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | CONV-01 | T-1-01 | Input payload rejects unexpected fields and only accepted slots are persisted | integration | `pnpm vitest run tests/conversation/intake-confirmation.test.ts -t "CONV-01"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | CONV-02 | T-1-02 | Waypoint parse path marks ambiguous points as blocking and keeps raw+normalized values | unit | `pnpm vitest run tests/constraints/waypoint-normalization.test.ts -t "CONV-02"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | CONV-03 | T-1-03 | Date range/trip days are normalized and invalid ranges are rejected | unit | `pnpm vitest run tests/constraints/date-range.test.ts -t "CONV-03"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | CONV-04 | T-1-04 | Ride window is validated as hard constraint with deterministic duration derivation | unit | `pnpm vitest run tests/constraints/ride-window.test.ts -t "CONV-04"` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | CONV-05 | T-1-05 | Intensity profile maps to deterministic cap table (easy/standard/challenge) | unit | `pnpm vitest run tests/constraints/intensity-profile.test.ts -t "CONV-05"` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 1 | RELY-02 | T-1-06 | Recap is regenerated from canonical machine-readable draft, never used as source-of-truth | integration | `pnpm vitest run tests/recap/canonical-projection.test.ts -t "RELY-02"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` + `vitest.config.ts` — test runner bootstrap
- [ ] `tests/conversation/intake-confirmation.test.ts` — CONV-01 coverage
- [ ] `tests/constraints/waypoint-normalization.test.ts` — CONV-02 coverage
- [ ] `tests/constraints/date-range.test.ts` — CONV-03 coverage
- [ ] `tests/constraints/ride-window.test.ts` — CONV-04 coverage
- [ ] `tests/constraints/intensity-profile.test.ts` — CONV-05 coverage
- [ ] `tests/recap/canonical-projection.test.ts` — RELY-02 coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clarification prompt language is clear to rider and one-turn correction is understandable | CONV-01, CONV-02 | Conversational quality cannot be fully judged by assertions | Run scripted conversation samples and verify recap/clarification wording in chat transcript |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
