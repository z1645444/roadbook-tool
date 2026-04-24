# Phase 1: 输入契约与缺失处理 - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段仅定义“输入解析与缺失处理”的统一契约：如何把自然语言与结构化字段归一化、如何处理缺失与冲突、以及后续阶段可复用的前置输出骨架。POI 推荐、路线编排、链接构造与二维码生成不在本阶段实现。

</domain>

<decisions>
## Implementation Decisions

### 输入模式与字段优先级
- **D-01:** 采用双通道输入：自然语言 + 结构化字段。
- **D-02:** 冲突时“显式结构化字段优先”，自然语言用于补充与回填。
- **D-03:** 地点字段采用“文本优先（name/address/city）+ 坐标可选”，不强制坐标必填。

### 缺失与默认策略
- **D-04:** 起点/终点缺失必须在假设区显式声明；其他字段可自动假设。
- **D-05:** 默认交通方式为骑行。
- **D-06:** 时间预算缺失时不设置硬约束，仅标注“未限制时长”。
- **D-07:** 二维码能力不可用时必须降级为“仅地址输出”，并附明确说明。

### 地点消歧与多城市
- **D-08:** 城市判定优先级：显式城市 > 地点文本中的城市信息 > 默认城市。
- **D-09:** 同名地点先同城筛选，再按语义匹配与偏好排序；保留候选并在假设区声明。
- **D-10:** 允许跨城行程，需标注“跨城路线”并提示时长不确定。
- **D-11:** 地点文本与坐标冲突时，以坐标为准并显式提示冲突。

### Phase 1 输出前置结构
- **D-12:** 固定解析结果对象字段顺序，保证多 agent 消费稳定性。
- **D-13:** 假设声明按逐条编号输出。
- **D-14:** 输出消歧候选 `candidates[]`，不只给最终选中项。
- **D-15:** 输出采用“自然语言优先 + 可机读补充”的双视图；最终展示先人读，再附结构化内容。

### the agent's Discretion
- 具体字段命名（如 `trip_intent`、`assumptions`、`candidates`）与键风格（snake_case/camelCase）。
- 候选排序分值的细粒度计算方式。
- 缺失字段提示文案的措辞模板。

</decisions>

<specifics>
## Specific Ideas

- 用户明确要求：Q4“应优先自然语言输出”，结构化输出作为补充而非主展示。
- 本项目定位为跨 agent 复用 skill（openclaw / hermes / claude code / codex），不是独立 app。

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and constraints
- `.planning/PROJECT.md` — 项目定位、能力边界、输出约束（含二维码降级策略）。
- `.planning/REQUIREMENTS.md` — v1 需求与 Traceability（INT-01/02/03 为本阶段核心）。
- `.planning/ROADMAP.md` — Phase 1 目标与成功标准。

### Runtime and workflow contract
- `AGENTS.md` — 当前仓库的 agent 范围声明与下一步工作约定。
- `.planning/config.json` — workflow 配置（执行模式、自动推进等）。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库尚无业务源码；本阶段将产出的输入契约文档与模板即为后续可复用资产。

### Established Patterns
- 以 `.planning/*` 文档驱动的 phase 交付流程已建立。
- 输出策略采取“可降级但主链路必达”（二维码失败不阻断地址输出）。

### Integration Points
- 后续 `gsd-plan-phase 1` 需直接基于本 CONTEXT 的 D-01 ~ D-15 拆分实现任务。
- Phase 2（POI 推荐）消费本阶段输入归一化结构与假设声明格式。

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 01-input-contract-missing-assumptions*
*Context gathered: 2026-04-24*
