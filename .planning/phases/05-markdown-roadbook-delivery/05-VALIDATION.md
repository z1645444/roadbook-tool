---
phase: 05
slug: markdown-roadbook-delivery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-22
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts -t "BOOK-01"` |
| **Full suite command** | `pnpm vitest run tests/roadbook tests/conversation tests/routing` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts -t "BOOK-01"`
- **After every plan wave:** Run `pnpm vitest run tests/roadbook tests/conversation tests/routing`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | BOOK-01, BOOK-02 | T-05-01 | Renderer escapes markdown-sensitive text and deterministically emits day-grouped headings, route summary, and waypoint sequence from canonical route data. | unit | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts -t "BOOK-01|BOOK-02"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | BOOK-01, BOOK-03 | T-05-04, T-05-06 | Controller only renders roadbook in `routing_ready` path and includes lodging shortlist details without leaking raw provider payload. | integration | `pnpm vitest run tests/conversation/intake-confirmation.test.ts -t "BOOK-01|BOOK-03"` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | BOOK-04 | T-05-07, T-05-09 | Output includes assumptions and constraints summary with route metadata so users can validate plan correctness. | unit+integration | `pnpm vitest run tests/roadbook/markdown-roadbook.renderer.test.ts tests/conversation/intake-confirmation.test.ts -t "BOOK-04"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/roadbook/markdown-roadbook.renderer.test.ts` — BOOK-01..BOOK-04 renderer coverage
- [ ] `tests/conversation/intake-confirmation.test.ts` — controller route-ready roadbook assertions
- [ ] `src/roadbook/markdown-roadbook.renderer.ts` — deterministic markdown renderer implementation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chinese readability and planning clarity of generated markdown in long multiday scenarios | BOOK-01..BOOK-04 | Automated tests can verify structure/fields but not final human readability quality for trip execution. | Run two representative multiday conversations and manually review formatting, sequencing, and assumptions clarity in rendered markdown. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
