# Phase 4: 高德链接构造 - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段仅定义“高德导航链接构造规则”：将已确认顺序的路线节点映射为可点击的 `https://uri.amap.com/navigation` 链接，并满足编码、兼容与降级约束。不负责 POI 推荐算法与路线重排。

</domain>

<decisions>
## Implementation Decisions

### URI 主路径与参数基线
- **D-01:** 主链接统一使用 `https://uri.amap.com/navigation`。
- **D-02:** `callnative=1` 作为链接输出基线参数。
- **D-03:** 默认不使用 `via`；仅当未来高德官方明确支持“更多模式 + 多 via”时再评估开启。
- **D-04:** 坐标与文本同时存在时，定位参数优先使用坐标（GCJ-02），文本作为展示补充；无坐标时回退到文本参数。

### 多途经点与输出形态
- **D-05:** 路线层允许多个途经点，但单条 URI 不承载多途经点；采用混合输出：先输出总段导航，再按顺序输出分段导航。
- **D-06:** 用户确认顺序后禁止自动重排，严格按确认顺序生成分段。
- **D-07:** 分段链接全部显式填写 `from/to`，不依赖“当前位置自动补位”。
- **D-08:** 固定编号输出格式：`L0` 为总段，`L1..Ln` 为分段链接。

### 起终点缺失与停止条件
- **D-09:** 总段起点优先级为“用户显式起点 > 当前位置”。
- **D-10:** 若无起点且无法定位，必须停止生成链接并提示用户补充起点。
- **D-11:** 若终点缺失，必须停止生成链接并提示用户补充终点。

### scheme 与兼容策略
- **D-12:** 默认仅输出 `https` 链接；仅在用户明确要求时附带 scheme 链接。
- **D-13:** 即使未来附带 scheme，`https` 兜底链接仍为必需保留项。

### the agent's Discretion
- `src` 等业务标识参数命名与默认值。
- 分段文案中每条链接前后的提示语模板。
- `mode/policy` 默认值在不违背本阶段决策下的具体落值。

</decisions>

<specifics>
## Specific Ideas

- 用户要求在“最终确认排序后”再生成链接输出。
- 多途经点示例确认顺序为：`A1 -> A3 -> A2 -> B3 -> B2 -> B1`。
- 对上述示例，输出结构应为：先 `A1 -> B1` 总段，再 `A1->A3`、`A3->A2`、`A2->B3`、`B3->B2`、`B2->B1` 分段。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and hard constraints
- `AGENTS.md` — 本仓库 skill 范围与高德链接约束（`callnative=1`、编码、兼容兜底、不做真实请求）。
- `.planning/PROJECT.md` — 高德优先策略、坐标系约束（GCJ-02）与 scheme 兜底原则。
- `.planning/REQUIREMENTS.md` — AMAP-01/02/03/04 的验收范围。
- `.planning/ROADMAP.md` — Phase 4 目标与成功标准。

### Upstream locked decisions
- `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md` — 缺失处理与“失败降级不阻断主链路”的上游决策。

### AMap official references
- `https://lbs.amap.com/api/uri-api/guide/travel/route` — URI 路径规划参数与约束（含 `via` 限制、移动端起点补位说明）。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库尚无运行时代码；本阶段将输出规则文档作为后续实现与测试的单一依据。

### Established Patterns
- 以 `.planning/*` 文档为主的“先定约束再执行”流程已建立。
- Phase 1 已确立“输入缺失要显式说明，主链路策略可降级但不含糊”的决策风格。

### Integration Points
- 上游 Phase 3 提供已确认顺序的节点列表，本阶段据此生成 `L0/L1..Ln` 链接清单。
- 下游 Phase 5 消费本阶段链接输出结构，补充地址与二维码协议层。

</code_context>

<deferred>
## Deferred Ideas

- 当高德 URI 官方未来支持“更多模式 + 多 via”时，评估是否将多途经点合并为单条总段导航 URI。

</deferred>

---
*Phase: 04-amap-link-construction*
*Context gathered: 2026-04-27*
