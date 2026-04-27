---
phase: 06-output-contract-reset
plan: 01
subsystem: docs
tags: [contract, amap, output-template, compatibility]
requires:
  - phase: 05-address-and-qr-output-protocol
    provides: 地址输出约束与降级语义
provides:
  - v1.1 主契约文档（四字段 + 固定顺序）
  - v1.1 normal/degraded 模板文档
  - AGENTS 主契约口径修正
affects: [phase-07-compatibility-layer, phase-08-docs-validation]
tech-stack:
  added: []
  patterns: [single-source-output-contract, fixed-field-order]
key-files:
  created:
    - .planning/phases/06-output-contract-reset/06-OUTPUT-CONTRACT-v1.1.md
    - .planning/phases/06-output-contract-reset/06-OUTPUT-TEMPLATE-v1.1.md
  modified:
    - AGENTS.md
key-decisions:
  - "v1.1 主契约只保留 route_summary/address/eta/notes 四字段"
  - "二维码字段从主契约移除，仅允许进入兼容层讨论"
patterns-established:
  - "主契约字段顺序固定：route_summary -> address -> eta -> notes"
  - "A-G 仅兼容视图，不得反向影响主契约字段集合"
requirements-completed: [OC-01, OC-02]
duration: 15min
completed: 2026-04-27
---

# Phase 6 Plan 01 Summary

**v1.1 主契约收敛为四字段并建立固定顺序模板，二维码主字段被显式移除。**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-27T09:14:00Z
- **Completed:** 2026-04-27T09:29:44Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- 修正 `AGENTS.md` 范围描述，消除 A-G 与 v1.1 主契约冲突。
- 新建主契约规范文档，明确四字段白名单与二维码字段移除清单。
- 新建 normal/degraded 模板文档，统一固定渲染顺序并隔离兼容层说明。

## Task Commits

1. **Task 0: 更新 AGENTS 输出口径** - `ee1cab1` (docs)
2. **Task 1: 编写 v1.1 主契约规范** - `b859bbe` (docs)
3. **Task 2: 编写 v1.1 输出模板** - `45426a3` (docs)

## Files Created/Modified

- `AGENTS.md` - 对齐 v1.1 主契约口径，声明 A-G 仅兼容视图。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-CONTRACT-v1.1.md` - 主契约与禁用字段规范。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-TEMPLATE-v1.1.md` - normal/degraded 输出模板。

## Decisions Made

- 保留 Phase 5 地址 URI 约束（`https://uri.amap.com/...` + `callnative=1`），但不回引二维码主字段。
- 将兼容层迁移细则延后到 Phase 7，Phase 6 只冻结主契约边界。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 原流程示例中的 `state.begin-phase` 参数形态与本机 `gsd-sdk query` 适配层不一致，已改用位置参数执行并校验结果。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 已具备把主契约转成 schema/example/checklist 自动验证资产的前置基础。
- 可进入 Plan 06-02 产出机读校验三件套。

