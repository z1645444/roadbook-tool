# Roadmap: 高德路线助手 Skill

## Milestones

- ✅ **v1.0 milestone** — Phases 1-5 (shipped 2026-04-27)
- 🚧 **v1.1 output-contract-reset** — Phases 6-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 milestone (Phases 1-5) — SHIPPED 2026-04-27</summary>

- [x] Phase 1: 输入契约与缺失处理 (2/2 plans) — completed 2026-04-27
- [x] Phase 2: POI 推荐策略 (2/2 plans) — completed 2026-04-27
- [x] Phase 3: 路线编排规则 (2/2 plans) — completed 2026-04-27
- [x] Phase 4: 高德链接构造 (2/2 plans) — completed 2026-04-27
- [x] Phase 5: 地址与二维码输出协议 (2/2 plans) — completed 2026-04-27

</details>

### 🚧 v1.1 output-contract-reset

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 6 | 输出主契约重置 | 以 route_summary/address/eta/notes 作为唯一主契约字段 | OC-01, OC-02 | 2 |
| 7 | 兼容层与迁移策略 | 将 A-G 降级为兼容视图，并定义 v1.0→v1.1 字段迁移规则 | OC-03, OC-06 | 2 |
| 8 | 文档与验证统一 | 统一 PROJECT/ROADMAP/REQUIREMENTS/AGENTS 口径并补齐 schema/example/checklist | OC-04, OC-05 | 2 |

## Phase Details (v1.1)

### Phase 6: 输出主契约重置
Goal: 收敛主输出字段为 `route_summary/address/eta/notes`，移除二维码主契约字段。
Requirements: OC-01, OC-02
**Plans:** 2 plans
Success criteria:
1. 主契约字段在协议和模板中保持唯一且固定顺序。
2. QR 相关字段不再出现在 v1.1 主 schema 与主示例中。

### Phase 7: 兼容层与迁移策略
Goal: 保留 A-G 兼容渲染能力，并给出 v1.0→v1.1 字段迁移说明。
Requirements: OC-03, OC-06
**Plans:** 2 plans
Success criteria:
1. A-G 仅作为兼容层，不作为主契约字段源。
2. 提供明确迁移映射（保留/删除/重命名）并可复核。

### Phase 8: 文档与验证统一
Goal: 统一跨文档口径并形成新的可执行验证资产。
Requirements: OC-04, OC-05
**Plans:** 2 plans
Success criteria:
1. PROJECT/ROADMAP/REQUIREMENTS/AGENTS 的输出口径一致。
2. 新 schema/example/checklist 支持自动化验证 v1.1 契约。

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|---|---|---|---|---|
| 1. 输入契约与缺失处理 | v1.0 | 2/2 | Complete | 2026-04-27 |
| 2. POI 推荐策略 | v1.0 | 2/2 | Complete | 2026-04-27 |
| 3. 路线编排规则 | v1.0 | 2/2 | Complete | 2026-04-27 |
| 4. 高德链接构造 | v1.0 | 2/2 | Complete | 2026-04-27 |
| 5. 地址与二维码输出协议 | v1.0 | 2/2 | Complete | 2026-04-27 |
| 6. 输出主契约重置 | v1.1 | 2/2 | Complete | 2026-04-27 |
| 7. 兼容层与迁移策略 | v1.1 | 0/2 | Not started | - |
| 8. 文档与验证统一 | v1.1 | 0/2 | Not started | - |

## Archive

- v1.0 roadmap archive: [.planning/milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)
