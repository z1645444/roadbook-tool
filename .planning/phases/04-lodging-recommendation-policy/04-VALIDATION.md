---
phase: 04
slug: lodging-recommendation-policy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-21
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/routing/lodging-policy.service.test.ts` |
| **Full suite command** | `pnpm vitest run tests/routing tests/map-provider tests/shared/validation` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/routing/lodging-policy.service.test.ts`
- **After every plan wave:** Run `pnpm vitest run tests/routing tests/map-provider tests/shared/validation`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | LODG-01 | T-04-01 | Provider adapter validates and sanitizes AMap payload fields before policy pipeline consumes them. | unit | `pnpm vitest run tests/map-provider/amap-lodging.adapter.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | LODG-02, LODG-03, LODG-04 | T-04-02 | Policy filter never emits entries below rating floor or outside category price rules. | unit | `pnpm vitest run tests/routing/lodging-policy.service.test.ts -t "strict policy"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | LODG-05 | T-04-03 | Fallback flow logs stage transitions and returns explicit no-match status after final stage. | unit | `pnpm vitest run tests/routing/lodging-policy.service.test.ts -t "fallback"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | LODG-01..LODG-05 | T-04-04 | Orchestrator integrates lodging results only for days with overnight stops and preserves fallback safety behavior. | integration | `pnpm vitest run tests/routing/lodging-integration.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/routing/lodging-policy.service.test.ts` — policy filter and fallback coverage for LODG-02..05
- [ ] `tests/map-provider/amap-lodging.adapter.test.ts` — adapter payload, timeout, and mapping checks for LODG-01
- [ ] `tests/routing/lodging-integration.test.ts` — orchestrator day-stage integration for LODG-01..05
- [ ] `tests/shared/validation/multiday-lodging-artifact.schema.test.ts` — schema guards for lodging payload fields

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-world sparse-area lodging availability behavior with live AMap data | LODG-05 | Deterministic CI fixtures cannot cover live POI volatility and quota dynamics. | Run staged route samples in two known sparse regions, verify fallback trace and no-match messaging are actionable. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
