# Phase 4: 高德链接构造 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 04-高德链接构造
**Areas discussed:** URI 主路径与参数基线, 参数映射与缺失兜底, 多途经点顺序与编码细则, scheme 附带与展示策略

---

## URI 主路径与参数基线

| Option | Description | Selected |
|--------|-------------|----------|
| 统一 `https://uri.amap.com/navigation` | 单主路径，减少分支 | ✓ |
| 多路径按场景切换 | 表达力更强但实现复杂 | |
| navigation 为主 + 例外路径 | 需维护例外清单 | |

**User's choice:** 统一 `https://uri.amap.com/navigation`
**Notes:** 用户要求优先稳定规则，降低实现歧义。

| Option | Description | Selected |
|--------|-------------|----------|
| `callnative=1` 必填 | 与项目约束一致 | ✓ |
| `callnative` 可选 | 灵活但分支更多 | |

**User's choice:** `callnative=1` 必填
**Notes:** 与 AGENTS/PROJECT 约束对齐。

| Option | Description | Selected |
|--------|-------------|----------|
| 坐标优先，文本补充 | 稳定、可复现 | ✓ |
| 文本优先，坐标兜底 | 依赖检索语义 | |
| 同时拼入不设优先级 | 行为不可控 | |

**User's choice:** 坐标优先，文本补充
**Notes:** 用户追问了“影响范围”，确认这是链接参数层决策。

---

## 参数映射与缺失兜底

| Option | Description | Selected |
|--------|-------------|----------|
| `to+callnative=1` 最小集 | 允许起点兜底 | |
| `from+to+callnative=1` 强约束 | 可复现更高 | |
| 混合规则（语义起点优先，兜底补位） | 兼顾用户体验与准确性 | ✓ |

**User's choice:** 混合规则
**Notes:** 用户明确总段起点“显式起点优先，否则当前位置”。

| Option | Description | Selected |
|--------|-------------|----------|
| 无起点且无法定位时仍输出终点直达 | 可能误导 | |
| 无起点且无法定位时停止生成 | 要求补充起点 | ✓ |

**User's choice:** 无起点且无法定位时停止生成
**Notes:** 用户要求明确告知并停止。

| Option | Description | Selected |
|--------|-------------|----------|
| 终点缺失时停止生成并要求补充 | 明确边界 | ✓ |
| 临时推断终点并标待确认 | 有歧义风险 | |
| 仅输出文本路线 | 链路不完整 | |

**User's choice:** 终点缺失时停止生成并要求补充
**Notes:** 与“明确性优先”一致。

---

## 多途经点顺序与编码细则

| Option | Description | Selected |
|--------|-------------|----------|
| 确认后不自动重排 | 严格执行用户排序 | ✓ |
| 允许算法微调排序 | 可能偏离用户意图 | |

**User's choice:** 不自动重排
**Notes:** 排序确认后视为锁定输入。

| Option | Description | Selected |
|--------|-------------|----------|
| 坐标优先，缺失回退文本 | 稳定 + 兼容 | ✓ |
| 全文本 | 精度较低 | |
| 坐标文本都必须有 | 过严 | |

**User's choice:** 坐标优先，缺失回退文本
**Notes:** 与 Area 1 一致。

| Option | Description | Selected |
|--------|-------------|----------|
| `L0/L1..Ln` 编号列表 | 最清晰可执行 | ✓ |
| 自然语言段落 | 可读但不利执行 | |
| 表格 | 结构化强 | |

**User's choice:** `L0/L1..Ln` 编号列表
**Notes:** 需先输出总段再输出分段。

---

## scheme 附带与展示策略

| Option | Description | Selected |
|--------|-------------|----------|
| 默认只输出 https，按需附带 scheme | 兼容性优先 | ✓ |
| 默认同时输出 https + scheme | 信息量更大 | |
| 仅输出 scheme | 风险高 | |

**User's choice:** 默认只输出 https，按需附带 scheme
**Notes:** 用户先确认了 scheme 含义后作出选择。

---

## the agent's Discretion

- `src` 与可选参数的默认落值。
- 分段链接前后提示语细节。

## Deferred Ideas

- 若高德官方未来支持多 `via` 与更多模式，再评估单 URI 承载多途经点能力。
