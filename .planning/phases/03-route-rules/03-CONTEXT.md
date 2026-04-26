# Phase 3: 路线编排规则 - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责把起点、途经点、终点组织成可执行顺序路线，
并为每段输出交通方式与简要耗时说明。
在起终点缺失时按已锁定规则补位并显式声明。
不包含 URI 构造、二维码输出与真实 API 请求。

</domain>

<decisions>
## Implementation Decisions

### 分段交通方式分配
- **D-01:** 交通方式优先级为“用户指定 > 默认骑行”。
- **D-02:** 支持用户按总路程中的具体路段分别指定交通方式。
- **D-03:** 当用户只指定部分路段时，未指定路段统一补为默认骑行。
- **D-04:** 用户指定与常识冲突时不自动改写，保留指定并追加风险提示。
- **D-05:** 分段交通方式输入采用自然语言优先。

### 起终点缺失兜底
- **D-06:** 缺失起点时，补位为当前城市中心点/市中心地标。
- **D-07:** 缺失终点时，补位为最后一个候选 POI。
- **D-08:** 起终点都缺失时，采用“起点=城市中心，终点=最后候选 POI”。
- **D-09:** 触发兜底后，A 段与路线正文都必须显式标注假设来源。

### 多途经点与回路处理
- **D-10:** 仅合并连续重复点；非连续重复点保留并说明原因。
- **D-11:** 允许回路/往返段，但必须显式标注。
- **D-12:** 非连续重复导致明显绕路时，保留原顺序并追加“可能绕路”提示。
- **D-13:** 回路意图与时间预算冲突时，时间预算优先；可弱化回路但必须说明。

### the agent's Discretion
- 路线排序算法的具体实现细节（在不违背已锁定顺序规则前提下）。
- 各交通方式的离线耗时估算口径与区间阈值。
- 风险提示与调整说明的具体文案模板。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and phase contract
- `.planning/PROJECT.md` — 项目定位、跨 agent 复用边界与输出约束。
- `.planning/REQUIREMENTS.md` — ROUTE-01/02/03 验收目标与追踪状态。
- `.planning/ROADMAP.md` — Phase 3 目标与成功标准。
- `AGENTS.md` — 仓库级约束、skill 范围与协作规则。

### Upstream input and POI dependencies
- `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md` — Phase 1 锁定规则与缺失声明策略。
- `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` — 输入字段优先级与冲突处理。
- `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` — A 段假设输出格式。
- `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json` — 归一化输入结构约束。
- `.planning/phases/02-poi/02-CONTEXT.md` — Phase 2 候选顺序与低置信策略。
- `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` — 候选 POI 输出字段约束。
- `.planning/phases/02-poi/02-POI-OUTPUT.example.json` — 候选顺序与双场景示例。
- `.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md` — 理由字段模板，供路线说明口径对齐。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `01-INPUT-CONTRACT.md`: 可直接复用输入字段与缺失处理语义。
- `01-ASSUMPTIONS-TEMPLATE.md`: 可复用兜底假设声明结构。
- `02-POI-OUTPUT.schema.json`: 可直接消费候选顺序与候选节点信息。
- `02-POI-OUTPUT.example.json`: 可复用 normal/insufficient 场景表达方式。

### Established Patterns
- 主链路不阻断：信息不足时降级继续输出，不直接失败。
- 假设显式化：缺失与冲突均在文本中明确说明。
- 自然语言优先：对用户可读输出优先，再附结构化补充。

### Integration Points
- Phase 3 直接消费 Phase 2 候选序列生成路线段。
- Phase 3 产出的段信息（顺序、方式、耗时）将被 Phase 4 用于 URI 参数构造。
- 兜底与风险提示语义将被 Phase 5 输出协议复用。

</code_context>

<specifics>
## Specific Ideas

- 用户明确要求支持“按路段指定交通方式”，且输入方式为自然语言优先。
- 用户明确要求在兜底与预算优先导致调整时，必须给出显式说明。

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 03-route-rules*
*Context gathered: 2026-04-26*
