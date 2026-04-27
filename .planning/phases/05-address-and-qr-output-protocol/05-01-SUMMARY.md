---
phase: 05-address-and-qr-output-protocol
plan: "01"
subsystem: docs
tags: [output, address, qr, protocol, template]
requires: []
provides:
  - Phase 5 输出协议主文档（字段契约、状态矩阵、降级规则）
  - normal 与 address_only_degraded 双模板
  - A-G 兼容渲染映射与 OUT-01..04 追踪
affects: [phase-05-validation]
tech-stack:
  added: []
  patterns: [docs-first-contract, graceful-degradation]
key-files:
  created:
    - .planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-PROTOCOL.md
    - .planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-TEMPLATE.md
  modified: []
key-decisions:
  - "地址 URL 为必达主链路，二维码能力仅作为可选增强。"
  - "二维码失败统一降级为 address-only，且必须给出原因。"
patterns-established:
  - "固定字段顺序输出（路线摘要、地址、预计花费时间、其他说明、二维码状态）"
  - "A-G 兼容外壳与 machine-readable appendix 并存"
requirements-completed: [OUT-01, OUT-02, OUT-03, OUT-04]
duration: 7 min
completed: 2026-04-27
---

# Phase 05 Plan 01: 固化地址与二维码输出协议及 A-G 兼容模板 Summary

**完成 Phase 5 地址与二维码输出协议与双模板文档，明确二维码可选、地址必达和降级路径。**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-27T08:01:37Z
- **Completed:** 2026-04-27T08:08:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- 创建 `05-OUTPUT-PROTOCOL.md`，固化 `route_summary/address/eta/notes/qr_status` 字段契约。
- 固定地址协议为 `L0 + L1..Ln`，并显式要求 `https://uri.amap.com/...`、`callnative=1`、URL 编码。
- 建立二维码状态矩阵（`available|unavailable|not_requested`）与 `qr_payload_text` 约束。
- 明确 OUT-03 的 UTF-8 字节一致性校验与 OUT-04 的 address-only 降级规则。
- 创建 `05-OUTPUT-TEMPLATE.md`，提供 `normal` 与 `address_only_degraded` 模板及 machine-readable appendix。

## Task Commits

1. **Task 1: 编写输出协议主文档并锁定 OUT-01..04** - `d6c85b9` (docs)
2. **Task 2: 编写最终输出模板并固定 address-only 退化文案** - `0faa893` (docs)

## Files Created/Modified

- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-PROTOCOL.md` - 输出字段、地址协议、二维码状态矩阵、降级策略、A-G 映射。
- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-TEMPLATE.md` - `normal` 与 `address_only_degraded` 模板及机读附录示例。

## Decisions Made

- 模板中的 E 段固定为二维码状态说明，不输出二维码图片。
- 降级文案固定为“二维码当前不可用，已提供可复制地址链接”，避免各 runtime 漂移。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 05-02-PLAN.md。
- 可直接基于本协议生成 schema/example/checklist 三件套。

## Self-Check: PASSED
