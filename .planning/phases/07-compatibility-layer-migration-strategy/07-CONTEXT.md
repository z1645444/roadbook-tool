# Phase 7: 兼容层与迁移策略 - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段定义 v1.0 -> v1.1 的迁移策略与可验证规则，目标是从当前阶段开始完全移除 A-G 输出，统一收敛为 `route_summary/address/eta/notes` 四字段，并补齐可复核迁移矩阵与阻断式验证门禁。

不回改历史 phase 资产；历史文档仅作为迁移输入与对照证据。

</domain>

<decisions>
## Implementation Decisions

### 兼容层策略（破坏性变更）
- **D-01:** 从 Phase 7 起完全移除 A-G，不再保留“可选兼容视图”。
- **D-02:** 对旧调用采用 fail-fast（breaking change），并立即生效（Phase 7 合并后无过渡期）。
- **D-03:** fail-fast 场景仍保持四字段返回结构，不输出 A-G。
- **D-04:** fail-fast 触发条件采用显式白名单信号（命中任一即触发）。
- **D-05:** fail-fast 使用单一错误码 `E_COMPAT_AG_REMOVED`，并在 `notes` 中同时提供迁移指引。

### 四字段落位规则
- **D-06:** `address` 仅承载主链接 `L0`（可执行主链路）。
- **D-07:** 分段链接 `L1..Ln` 不再作为独立旧结构输出，迁移到 `notes`。
- **D-08:** `notes` 对分段链接采用混合格式：先自然语言，再附结构化片段。
- **D-09:** 二维码相关字段（如 `qr_status`/`qr_payload_text`）全部移除，不做新字段承接。
- **D-10:** `eta` 保持纯用户可读文本，不引入旧机读子结构。

### 迁移矩阵规范
- **D-11:** 迁移说明使用单表矩阵（`old_field | action | new_field | reason`）。
- **D-12:** 矩阵覆盖所有 v1.0 对外字段（含 A-G、二维码字段、旧机读附录关键键）。
- **D-13:** 每一行矩阵必须包含 `verification` 列，保证逐项可复核。
- **D-14:** 对 `merge` 类映射采用严格模板化描述：`target_format + example_snippet + verification`。

### 防反污染门禁
- **D-15:** 采用 Schema + Checklist 双门禁，防止旧结构回流。
- **D-16:** 维护集中黑名单文件，schema/checklist 共同引用同一禁入清单。
- **D-17:** 命中黑名单即直接阻断（不降级为告警）。
- **D-18:** 阻断反馈必须逐项列出命中字段与文件位置。

### Phase 7 交付边界
- **D-19:** Phase 7 交付文档 + schema + example + checklist 全套资产。
- **D-20:** 资产命名采用 `07-*` + `v1.1` 版本标识。
- **D-21:** 验证范围至少覆盖：禁旧字段、迁移矩阵逐项可复核、示例通过 schema。
- **D-22:** Phase 7 直接更新 `AGENTS.md` 口径，明确 A-G 在 v1.1 中完全移除。

### the agent's Discretion
- A-G 依赖信号白名单的具体键名命名（在不改变“显式白名单 + 命中即拦截”前提下）。
- `notes` 中结构化片段的最小字段集合命名（在“自然语言 + 结构化片段”原则内细化）。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope and requirements
- `AGENTS.md` — 当前仓库主约束；Phase 7 需将“A-G 兼容视图”改写为“完全移除 A-G”。
- `.planning/PROJECT.md` — v1.1 目标、当前里程碑状态与输出契约边界。
- `.planning/REQUIREMENTS.md` — OC-03/OC-06 当前映射（需在 Phase 7 对齐改写）。
- `.planning/ROADMAP.md` — Phase 7 目标与成功标准（需从“兼容层”切换为“移除策略”）。
- `.planning/STATE.md` — 当前执行上下文与里程碑进度。

### Upstream contract baseline (Phase 6)
- `.planning/phases/06-output-contract-reset/06-OUTPUT-CONTRACT-v1.1.md` — 四字段唯一主契约、禁用字段清单。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-TEMPLATE-v1.1.md` — normal/degraded 模板与旧兼容说明入口。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-v1.1.schema.json` — 现行四字段 schema 基线。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-v1.1.example.json` — 现行四字段示例基线。
- `.planning/phases/06-output-contract-reset/06-OUTPUT-v1.1-CHECKLIST.md` — v1.1 基线检查方法。
- `.planning/phases/06-output-contract-reset/06-REVIEW.md` — Phase 6 残余风险已指向 Phase 7 映射偏差。
- `.planning/phases/06-output-contract-reset/06-VERIFICATION.md` — Phase 6 已完成并允许进入 Phase 7。

### Legacy fields and migration sources (Phase 5 / Phase 3)
- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-PROTOCOL.md` — v1.0-era 字段来源（含 `qr_status`、`qr_payload_text`、A-G 映射）。
- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT-TEMPLATE.md` — legacy 输出模板与 A-G 渲染示例。
- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.schema.json` — legacy schema 字段全集来源。
- `.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json` — legacy 示例字段来源。
- `.planning/phases/03-route-rules/03-ROUTE-RULES.md` — 早期 A-G 段语义定义来源。
- `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.schema.json` — 早期 `output_views.ag_sections` 结构来源。
- `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.example.json` — 早期 A-G 示例来源。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库以文档/schema/example/checklist 为主，可直接复用 Phase 6 的四字段 schema 与 checklist 模式。
- Phase 5/3 的 schema/example 提供完整旧字段全集，可作为迁移矩阵输入源。

### Established Patterns
- docs-first + schema-first：先冻结契约，再产出示例与验证清单。
- 使用 `rg` + schema 校验命令作为验收证据，强调可复核。
- 里程碑切换时允许 breaking change，但需提供明确迁移说明。

### Integration Points
- Phase 7 的迁移矩阵将直接约束 Phase 8 的文档统一与验证资产。
- Phase 7 的黑名单门禁将成为后续回归校验入口，防止旧字段再流入 v1.1 资产。

</code_context>

<specifics>
## Specific Ideas

- 用户明确要求：不修改历史 phase 文件，从当前 phase 开始变更期望。
- 用户明确要求：完全移除 A-G，改用四字段，不保留兼容输出入口。
- 用户明确要求：旧调用一律 fail-fast，且立即生效。
- 用户明确要求：Phase 7 直接改写 `AGENTS.md` 口径，不延后到 Phase 8。

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 07-compatibility-layer-migration-strategy*
*Context gathered: 2026-04-28*
