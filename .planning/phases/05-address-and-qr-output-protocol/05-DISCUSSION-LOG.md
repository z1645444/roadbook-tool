# Phase 5: 地址与二维码输出协议 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 5-地址与二维码输出协议
**Areas discussed:** 输出结构基线, 地址输出协议, 预计耗时口径, 二维码协议, 冲突处理策略

---

## 输出结构基线

| Option | Description | Selected |
|--------|-------------|----------|
| 保留 A-G 固定结构 | 与既有 phase 完全一致，兼容成本最低 | |
| 新固定结构（非 A-G） | 面向字段协议，减少段落耦合 | |
| A-G 兼容层 + 字段主语义 | 外部可兼容，内部协议更清晰 | ✓ |

**User's choice:** 字段主语义优先，强调最终自然语言 human-readable；为最小破坏保留兼容能力。
**Notes:** 期间识别到 AGENTS/PROJECT 对 A-G 的口径冲突，先走“最小影响”策略并将彻底重置延后到下个 milestone。

---

## 地址输出协议

| Option | Description | Selected |
|--------|-------------|----------|
| 仅主链接（L0） | 输出最简，但分段可执行性弱 | |
| 主链接 + 全部分段（L1..Ln） | 可执行信息最完整 | ✓ |
| 主链接默认 + 分段按需展开 | 平衡简洁与完整 | |

**User's choice:** 2（主链接 + 全部分段）。
**Notes:** 该选择用于确保下游可直接执行分段导航。

---

## 预计耗时口径

| Option | Description | Selected |
|--------|-------------|----------|
| 仅总时长估算 | 简化输出 | |
| 总时长 + 分段估算 | 信息完整 | ✓ |
| 实时耗时拉取 | 需外部请求，不符合当前边界 | |

**User's choice:** 可计算/估算即可，当前不要求实时获取。
**Notes:** 明确“估算值”标注，避免误导为实时结果。

---

## 二维码协议（本 milestone）

| Option | Description | Selected |
|--------|-------------|----------|
| address-only（无二维码字段） | 与现有 OUT-02/03/04 冲突较大 | |
| qr-lite（仅状态） | 仍无法满足 OUT-03 | |
| 完整二维码字段（状态 + 载荷一致性） | 对前序 phase 破坏最小 | ✓ |

**User's choice:** do as u said（采用推荐的完整二维码字段方案）。
**Notes:** 明确不输出二维码图片/ASCII，仅输出文本载荷并做与地址字节一致性约束。

---

## 冲突处理策略

| Option | Description | Selected |
|--------|-------------|----------|
| 立即在本 milestone 全量重置契约 | 变更面大，风险高 | |
| 最小影响过渡（当前保持兼容，下个 milestone 重置） | 风险最低、可渐进落地 | ✓ |
| 维持现状不处理冲突 | 会持续产生口径漂移 | |

**User's choice:** 按最稳定、影响最小的方案处理。
**Notes:** 已同步记录下一 milestone 的 todo，专门处理“去二维码 + 字段收敛”改动。

---

## the agent's Discretion

- 输出文案模板细节与字段标题命名。
- 估算时长的呈现粒度（区间/单值）。
- 二维码不可用原因码命名方案。

## Deferred Ideas

- 下一 milestone：A-G 调整为“路线摘要、地址、预计花费时间、其他说明”，并取消二维码相关全部信息。
- 对应 todo：`.planning/todos/pending/2026-04-27-milestone-a-g-output-contract-remove-qr.md`
