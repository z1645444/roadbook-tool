# Phase 2: POI 推荐策略 - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只负责在既有输入契约之上，稳定产出 3-5 个候选 POI 及其可读推荐理由。
不包含路线编排、URI 构造、二维码输出与外部实时 API 请求。

</domain>

<decisions>
## Implementation Decisions

### 候选生成规则
- **D-01:** 候选数量采用动态 `3-5`，而非固定数量。
- **D-02:** 信息不足时允许输出 `2-3` 个候选，并显式标注“信息不足”。
- **D-03:** 候选补位优先使用“同城同类”高相关项。
- **D-04:** 约束冲突导致候选不足时，不放宽硬约束，只放宽软偏好。

### 排序优先级
- **D-05:** 在“同城优先”之后，主排序为：语义匹配 > 偏好匹配 > 可达性 > 热门度。
- **D-06:** 同分第一 tie-breaker 使用“理由可解释性”。
- **D-07:** 热门度仅作为兜底信号，不得压过语义与偏好。
- **D-08:** 跨城候选默认排在同城候选之后。

### 推荐理由格式
- **D-09:** 每个候选仅输出 1 句短理由。
- **D-10:** 理由采用固定模板：`匹配点 + 场景价值`。
- **D-11:** 不强制解释“为什么没选其他候选”。
- **D-12:** 仅在低置信场景显示置信标记。

### 多样性与去重
- **D-13:** Top3 候选至少覆盖 2 个类别。
- **D-14:** 重复判定为“同名 + 近地址”。
- **D-15:** 去重后使用同城高分候选补位。
- **D-16:** 同类候选连续最多 2 个，抑制扎堆。

### 低置信兜底
- **D-17:** 缺关键字段或语义冲突即触发低置信模式。
- **D-18:** 低置信模式仍输出候选，但每项标记低置信。
- **D-19:** 低置信时追加 1-2 条最关键补充信息建议。
- **D-20:** 低置信可进入下一阶段，但必须附风险提示。

### the agent's Discretion
- 各排序维度的具体打分函数与归一化方式。
- “近地址”阈值的工程化定义（文本相似度/距离阈值）。
- 同类判定标签体系（商圈、公园、街区、地标等）的具体实现。

</decisions>

<specifics>
## Specific Ideas

- 用户明确选择“动态 3-5”与“信息不足仍继续输出”的策略，强调不阻断主链路。
- 用户将“理由可解释性”提升为同分第一决策因素，优先保证结果可说明。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and acceptance
- `.planning/PROJECT.md` — 当前阶段定位、跨 agent 复用目标、能力边界。
- `.planning/REQUIREMENTS.md` — POI-01/POI-02/POI-03 的验收约束与追踪状态。
- `.planning/ROADMAP.md` — Phase 2 目标与成功标准。
- `AGENTS.md` — skill 输出约束与项目级协作规则。

### Upstream contract dependencies
- `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md` — Phase 1 锁定决策（同城优先、冲突处理等）。
- `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` — 输入字段优先级与缺失处理规范。
- `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` — A 段假设与低置信声明格式。
- `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json` — 归一化输出约束。
- `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.example.json` — 兼容示例与排序/候选表达参考。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `01-INPUT-CONTRACT.md`：可直接复用输入优先级、缺失与冲突处理规则。
- `01-NORMALIZED-OUTPUT.schema.json`：可作为 POI 输出结构与字段一致性的约束基线。
- `01-ASSUMPTIONS-TEMPLATE.md`：可复用低置信与补充信息提示文案结构。

### Established Patterns
- 采用文档与 schema 双轨约束，先人读后机读。
- 主链路不阻断：信息不足时降级而非失败。
- 同城优先、冲突显式声明、候选数组必须输出。

### Integration Points
- Phase 2 输出的候选顺序与理由，将直接喂给 Phase 3 的路线编排输入。
- 低置信标记与补充建议将作为后续阶段风险提示来源。

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 02-poi*
*Context gathered: 2026-04-26*
