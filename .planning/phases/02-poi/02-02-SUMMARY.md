---
phase: 02-poi
plan: "02"
subsystem: api
tags: [poi, schema, example, validation]
requires:
  - phase: 02-poi
    provides: POI 策略与理由模板规范（D-01..D-20、R1-R5）
  - phase: 01-input-contract-missing-assumptions
    provides: 严格 schema/example 交付模式与校验基线
provides:
  - Phase 2 POI 输出 JSON Schema（严格 required 与条件分支）
  - normal/insufficient 双场景示例并通过同一 schema 校验
  - 下游可消费的排序、多样性、去重、低置信机读字段
affects: [phase-03-routing, output-protocol, skill-reuse]
tech-stack:
  added: []
  patterns: [strict-json-schema, conditional-candidate-mode, low-confidence-non-blocking]
key-files:
  created:
    - .planning/phases/02-poi/02-POI-OUTPUT.schema.json
    - .planning/phases/02-poi/02-POI-OUTPUT.example.json
  modified: []
key-decisions:
  - "candidate_count_mode 使用 normal|insufficient 条件分支锁定 3-5 与 2-3 候选"
  - "低置信模式强制 risk_note 与 1-2 条 supplement_suggestions，且逐候选显式 low 标记"
patterns-established:
  - "同城优先排序元数据固定化：same_city_first + primary_sort_order + cross_city_after_same_city"
  - "理由模板机读锚点：reason + reason_template_id + confidence_tag_visible"
requirements-completed: [POI-01, POI-02, POI-03]
duration: 8min
completed: 2026-04-26
---

# Phase 2 Plan 02: POI 输出 Schema 与 Example Summary

**交付了严格可机校验的 POI 输出契约，并提供 normal 与 information_insufficient 双场景确定性样例供下游直接消费。**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-26T05:56:00Z
- **Completed:** 2026-04-26T06:04:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- 创建 `02-POI-OUTPUT.schema.json`（draft-2020-12），完整表达数量模式、排序、理由、去重、多样性与低置信约束。
- 创建 `02-POI-OUTPUT.example.json`，覆盖 `normal_case` 与 `insufficient_case`，并通过同一 schema 的 Ajv 校验。
- 保持 Phase 2 范围边界：示例不包含 URI/路线/二维码或任何真实请求载荷字段。

## Task Commits

Each task was committed atomically:

1. **Task 1: 定义 POI 输出 JSON Schema（含低置信与多样性约束）** - `87ce862` (feat)
2. **Task 2: 编写 POI 输出示例并覆盖 normal 与信息不足场景** - `64d910c` (feat)

## Files Created/Modified

- `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` - POI 输出结构契约，含 D-01..D-20/POI-01..03 对应字段与条件规则。
- `.planning/phases/02-poi/02-POI-OUTPUT.example.json` - 双场景确定性样例，验证同城优先、跨城后置、低置信补充建议等行为。

## Decisions Made

- 使用 `candidate_count_mode` 条件分支作为唯一数量真源，避免跨 agent 自由发挥导致候选数量漂移。
- 低置信模式要求候选仍可输出但必须显式风险与补充建议，保障“非阻断”与“可追踪”同时成立。

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 可直接消费 `rank`、`same_city_first`、`primary_sort_order`、`reason_template_id` 与低置信字段。
- 无阻塞项。

## Self-Check: PASSED

- Verified file exists: `.planning/phases/02-poi/02-POI-OUTPUT.schema.json`
- Verified file exists: `.planning/phases/02-poi/02-POI-OUTPUT.example.json`
- Verified commit exists: `87ce862`
- Verified commit exists: `64d910c`
- Verified plan acceptance/verification commands pass:
  - `schema-json-ok`
  - `example-json-ok`
  - `schema-validate-ok`
  - scope boundary grep check (no URI/route/qrcode terms) passed
