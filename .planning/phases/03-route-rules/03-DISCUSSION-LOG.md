# Phase 3: 路线编排规则 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26T14:15:45Z
**Phase:** 03-route-rules
**Areas discussed:** 分段交通方式分配, 起终点缺失兜底路线, 多途经点与回路处理

---

## 分段交通方式分配

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 默认分配策略 | 自由输入 | 用户指定优先，默认骑行，支持分路段指定 |
| 部分路段未指定时补位 | 2 | 未指定路段统一默认骑行 |
| 指定与常识冲突时处理 | 2 | 保留用户指定并追加风险提示 |
| 分段指定输入格式偏好 | 1 | 纯自然语言优先 |

**User's choice:** `freeform + 2 + 2 + 1`

---

## 起终点缺失兜底路线

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 缺失起点默认补位 | 1 | 当前城市中心点/市中心地标 |
| 缺失终点默认补位 | 2 | 最后一个候选 POI |
| 起终点都缺失时策略 | 1 | 起点=城市中心，终点=最后候选 POI |
| 兜底触发后的显式说明 | B | A 段 + 路线正文双重标注 |

**User's choice:** `1 + 2 + 1 + B`

---

## 多途经点与回路处理

| Question | User Input | Resolved Choice |
|----------|------------|-----------------|
| 重复地点处理 | B | 合并连续重复点，非连续重复保留并说明 |
| 回路意图处理 | B | 允许回路，并显式标注回路/往返段 |
| 明显绕路时处理 | 2 | 保留顺序并追加可能绕路提示 |
| 回路意图与时间预算冲突 | 2 + 说明 | 时间预算优先，必要时弱化回路并说明调整 |

**User's choice:** `B + B + 2 + 2(说明)`

---

## the agent's Discretion

- 离线耗时估算公式与阈值留待 planning 阶段细化。

## Deferred Ideas

None.
