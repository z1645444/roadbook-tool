# Phase 2: POI 推荐策略 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26T00:00:00Z
**Phase:** 02-poi
**Areas discussed:** 候选生成规则, 排序优先级, 推荐理由格式, 多样性与去重, 低置信兜底

---

## 候选生成规则

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 候选数量策略 | B | 动态 3-5 |
| 信息不足时最少输出 | B | 输出 2-3 并明确不足 |
| 候选补位来源 | A | 同城同类优先补位 |
| 约束冲突时处理 | A | 不放宽硬约束，只放宽软偏好 |

**User's choice:** `BBAA`

---

## 排序优先级

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 同城内主排序 | A | 语义匹配 > 偏好匹配 > 可达性 > 热门度 |
| 同分第一 tie-breaker | B | 理由可解释性 |
| 热门度力度 | A | 仅兜底 |
| 跨城候选位置 | A | 默认在同城候选之后 |

**User's choice:** `ABAA`

---

## 推荐理由格式

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 每个 POI 理由长度 | A | 1 句短理由 |
| 理由结构 | A | 匹配点 + 场景价值 |
| 是否强制解释未选项 | A | 不强制 |
| 置信标记展示 | B | 仅低置信时显示 |

**User's choice:** `AAAB`

---

## 多样性与去重

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 类别多样性约束 | A | Top3 至少覆盖 2 类 |
| 重复判定 | A | 同名 + 近地址 |
| 去重后补位 | A | 同城高分补位 |
| 扎堆抑制 | A | 同类连续最多 2 个 |

**User's choice:** `AAAA`

---

## 低置信兜底

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 低置信触发条件 | A | 缺关键字段或语义冲突即触发 |
| 低置信输出形态 | A | 正常给候选并标记低置信 |
| 是否追加补充信息 | A | 追加 1-2 条关键补充项 |
| 是否允许进入下一阶段 | A | 允许，但带风险提示 |

**User's choice:** `AAAA`

---

## the agent's Discretion

- 具体分值模型、阈值和归一化细节留给后续 planning 阶段实现。

## Deferred Ideas

None.
