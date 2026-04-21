---
phase: 2
slug: routing-baseline-and-reliability
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/routing --reporter=dot` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~30-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/routing --reporter=dot`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | ROUT-01 | T-2-01 | Ambiguous geocode results are blocked pending user clarification before route generation | unit | `pnpm vitest run tests/routing/geocode-disambiguation.test.ts -t "ROUT-01"` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | ROUT-02 | T-2-02 | Consecutive route segments are generated via AMap bicycling API adapter and aggregated deterministically | unit | `pnpm vitest run tests/routing/bicycling-segments.test.ts -t "ROUT-02"` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | ROUT-05 | T-2-03 | Trip configured as one day returns single-day route artifact without stage split | integration | `pnpm vitest run tests/routing/single-day-guard.test.ts -t "ROUT-05"` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | RELY-01 | T-2-04 | AMap auth/quota/rate/provider failures map to safe user-facing fallback messages | unit | `pnpm vitest run tests/reliability/amap-fallback-errors.test.ts -t "RELY-01"` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | RELY-03 | T-2-05 | Route result persists reproducibility metadata with timestamp and request/response hash | unit | `pnpm vitest run tests/reliability/route-metadata-hash.test.ts -t "RELY-03"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/routing/geocode-disambiguation.test.ts` — ROUT-01 coverage
- [ ] `tests/routing/bicycling-segments.test.ts` — ROUT-02 coverage
- [ ] `tests/routing/single-day-guard.test.ts` — ROUT-05 coverage
- [ ] `tests/reliability/amap-fallback-errors.test.ts` — RELY-01 coverage
- [ ] `tests/reliability/route-metadata-hash.test.ts` — RELY-03 coverage

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User-facing fallback message clarity in chat tone and actionability | RELY-01 | Message readability and user trust are difficult to evaluate with assertions only | Run scripted failure scenarios (auth/quota/rate/provider outage) and confirm wording is clear, non-technical, and actionable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
