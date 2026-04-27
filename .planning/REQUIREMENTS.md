# Requirements: 高德路线助手 Skill (v1.1)

**Defined:** 2026-04-27
**Milestone:** v1.1 output-contract-reset
**Core Value:** 在输入不完整时，稳定输出可复制可执行的高德地址结果，并保持跨 agent 单一契约口径。

## v1.1 Requirements

### Output Contract Reset

- [ ] **OC-01**: Primary output contract uses exactly `route_summary`, `address`, `eta`, `notes` as first-class fields
- [ ] **OC-02**: QR-related fields are removed from the primary contract and examples in v1.1
- [ ] **OC-03**: A-G is retained only as an optional compatibility view, not as the canonical contract

### Consistency and Migration

- [ ] **OC-04**: PROJECT/ROADMAP/REQUIREMENTS/AGENTS use consistent wording for output contract scope
- [ ] **OC-05**: Provide updated schema + normal/degraded examples + validation checklist for the v1.1 contract
- [ ] **OC-06**: Migration notes describe how v1.0 QR fields map or drop in v1.1

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| Real-time external API invocation | This milestone focuses on contract alignment, not live data integration |
| QR image generation | Explicitly removed from v1.1 primary output scope |
| Standalone app UI | Repository remains a reusable skill artifact set |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OC-01 | Phase 6 | Pending |
| OC-02 | Phase 6 | Pending |
| OC-03 | Phase 7 | Pending |
| OC-04 | Phase 8 | Pending |
| OC-05 | Phase 8 | Pending |
| OC-06 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-04-27 for milestone v1.1*
