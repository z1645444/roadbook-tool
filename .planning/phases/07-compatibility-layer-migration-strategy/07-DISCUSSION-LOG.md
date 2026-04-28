# Phase 7: 兼容层与迁移策略 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 7-兼容层与迁移策略
**Areas discussed:** 兼容层输出策略, 字段派生与落位规则, 迁移映射矩阵规范, 防反污染约束, 交付与验证边界

---

## 兼容层输出策略

| Option | Description | Selected |
|--------|-------------|----------|
| 保留 A-G 兼容视图（按需输出） | 默认四字段，legacy 场景附带 A-G | |
| 四字段 + A-G 并行长期输出 | 兼容成本低，但主契约边界模糊 | |
| 完全移除 A-G | v1.1 仅四字段，旧调用 fail-fast | ✓ |

**User's choice:** 完全移除 A-G，不回改历史 phase，从当前 phase 起立即生效。
**Notes:** 明确接受 breaking change，并要求 fail-fast 仍保持四字段返回；触发条件采用显式白名单信号，错误码固定为 `E_COMPAT_AG_REMOVED`（结构化错误码 + 迁移指引）。

---

## 字段派生与落位规则

| Option | Description | Selected |
|--------|-------------|----------|
| `address` 承载 L0，分段链接进 `notes` | 保持主字段语义稳定 | ✓ |
| `address` 承载 L0+L1..Ln 复合块 | 信息集中但字段语义混杂 | |
| `address` 仅可读文本，链接都进 `notes` | 可读优先，但可执行主链路后置 | |

**User's choice:** `address` 仅承载 `L0`；`notes` 同时提供自然语言说明 + 结构化片段承载分段链接。
**Notes:** 二维码相关字段全部移除不承接；`eta` 保持纯用户可读文本，不保留旧机读子结构。

---

## 迁移映射矩阵规范

| Option | Description | Selected |
|--------|-------------|----------|
| 单表矩阵 + 全字段覆盖 + 行级验证 | 可审计、可复核、可自动化执行 | ✓ |
| 分章节描述为主 | 可读性强但可复核性弱 | |
| 仅高风险字段映射 | 成本低但易漏项 | |

**User's choice:** 使用单表矩阵，覆盖全部 v1.0 对外字段，每行必须有 `verification`。
**Notes:** `merge` 行采用严格模板：`target_format + example_snippet + verification`，避免“并入 notes”语义漂移。

---

## 防反污染约束

| Option | Description | Selected |
|--------|-------------|----------|
| Schema + Checklist 双门禁 | 结构与文档双重阻断旧字段回流 | ✓ |
| 仅 Schema | 结构强约束，但文档层可能漏检 | |
| 仅 Checklist | 依赖人工执行稳定性较弱 | |

**User's choice:** 双门禁 + 集中黑名单 + 命中即阻断。
**Notes:** 阻断反馈必须逐项列出命中字段与文件位置，不接受“仅告警”。

---

## 交付与验证边界

| Option | Description | Selected |
|--------|-------------|----------|
| 文档 + schema + example + checklist 全套 | Phase 7 内闭环并可直接验收 | ✓ |
| 仅文档，资产后置 Phase 8 | 当前推进快，但 Phase 8 成本高 | |
| 文档 + checklist，schema/example 延后 | 中间态，后续仍需补齐 | |

**User's choice:** Phase 7 交付全套资产，且命名采用 `07-* + v1.1`。
**Notes:** 验证必须覆盖“禁旧字段 + 矩阵逐项可复核 + 示例通过 schema”；并在 Phase 7 直接更新 `AGENTS.md` 口径。

---

## the agent's Discretion

- A-G 依赖信号白名单的具体键名命名。
- `notes` 结构化片段的键名与最小字段集合。

## Deferred Ideas

None.
