# Roadmap: 高德路线助手 Skill

**Generated:** 2026-04-24
**Project:** 高德路线助手 Skill
**Granularity:** Standard

## Overview

- Phases: 5
- v1 Requirements: 17
- Coverage: 100%
- Execution mode: Parallel plans allowed

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | 输入契约与缺失处理 | 把自然语言输入稳定转换为结构化上下文与假设 | INT-01, INT-02, INT-03 | 3 |
| 2 | POI 推荐策略 | 输出稳定的 3-5 候选 POI 与理由 | POI-01, POI-02, POI-03 | 3 |
| 3 | 路线编排规则 | 生成可执行顺序路线与分段耗时说明 | ROUTE-01, ROUTE-02, ROUTE-03 | 3 |
| 4 | 高德链接构造 | 生成可唤起高德的 URI HTTPS 链接并满足约束 | AMAP-01, AMAP-02, AMAP-03, AMAP-04 | 4 |
| 5 | 地址与二维码输出协议 | 输出地址与二维码文本，支持二维码能力降级 | OUT-01, OUT-02, OUT-03, OUT-04 | 4 |

## Phase Details

### Phase 1: 输入契约与缺失处理
Goal: 把用户自然语言和可选参数规范化为可下游处理的数据结构。
Requirements: INT-01, INT-02, INT-03
**Plans:** 2 plans
Success criteria:
1. 输入字段缺失时不会中断，且 A 段输出包含明确假设。
2. 城市、偏好、交通方式等关键字段有确定优先级与默认值。
3. 解析结果可直接供 POI 推荐与路线拼接使用。

Plans:
- [ ] 01-01-PLAN.md — 固化输入契约与 A 段假设模板
- [ ] 01-02-PLAN.md — 定义归一化输出 schema 与 example

### Phase 2: POI 推荐策略
Goal: 基于约束与偏好产出 3-5 个可解释的候选 POI。
Requirements: POI-01, POI-02, POI-03
Success criteria:
1. 候选 POI 数量保持在 3-5 个，且与用户意图一致。
2. 每个 POI 都有简明且可核对的推荐理由。
3. 候选顺序支持后续路线构建，不出现冲突节点。

### Phase 3: 路线编排规则
Goal: 输出按顺序可执行的路线方案，含每段方式与耗时。
Requirements: ROUTE-01, ROUTE-02, ROUTE-03
Success criteria:
1. 路线顺序完整覆盖起点、途经点、终点。
2. 每段都明确交通方式和简要耗时。
3. 起终点缺失时可通过假设策略继续生成有效路线说明。

### Phase 4: 高德链接构造
Goal: 生成兼容聊天与扫码场景的高德可点击链接。
Requirements: AMAP-01, AMAP-02, AMAP-03, AMAP-04
Success criteria:
1. 地址段始终输出完整 `https://uri.amap.com/...` 链接。
2. 链接参数正确编码，且包含 `callnative=1`。
3. 坐标出现时默认按 GCJ-02 约定表达。
4. 若附带 scheme，必须提供 https 兜底链接。

### Phase 5: 地址与二维码输出协议
Goal: 固化跨 agent 一致输出结构，二维码不可保证时降级地址输出。
Requirements: OUT-01, OUT-02, OUT-03, OUT-04
Success criteria:
1. 输出明确包含地址段，且可直接拷贝使用。
2. 在脚本能力可用时输出二维码文本（与地址一致）。
3. 二维码相关失败不阻断主流程，必须降级为地址-only。
4. 输出中明确说明“二维码可选/地址必达”的策略。

## Notes

- This roadmap targets a reusable skill package for multiple agent runtimes.
- Not a standalone app milestone.
- Live API calls are intentionally excluded in this initialization scope.
