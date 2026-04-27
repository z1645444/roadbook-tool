# 高德路线助手 Skill

## What This Is

这是一个给 `openclaw`、`hermes`、`claude code`、`codex` 等 agent 运行时复用的 skill，
用于把用户的自然语言出行需求转换为可执行的高德路线输出。
它不是独立 App，不负责界面、账号体系或后台服务，只负责稳定生成可直接使用的文本结果。

## Core Value

在输入不完整的情况下，稳定产出可直接使用的高德地址链接；若二维码生成不可保证，则至少输出可复制地址。

## Requirements

### Validated

- [x] 将自然语言需求解析为结构化意图（起点、终点、途经点、偏好、预算、城市）
  - Validated in Phase 1: 输入契约与缺失处理
- [x] 输入缺失时在输出 A 段明确假设与缺失信息，不中断结果生成
  - Validated in Phase 1: 输入契约与缺失处理
- [x] 生成 3-5 个候选 POI，并给出可读的推荐理由
  - Validated in Phase 2: POI 推荐策略
- [x] 候选顺序支持后续路线构建，不出现冲突节点
  - Validated in Phase 2: POI 推荐策略
- [x] 生成最终路线顺序，并给出每段方式与简要耗时
  - Validated in Phase 3: 路线编排规则
- [x] 输出可唤起高德的 `https://uri.amap.com/...` 完整链接，参数可用
  - Validated in Phase 4: 高德链接构造
- [x] 优先输出地址与二维码内容文本（二维码图片为可选能力）
  - Validated in Phase 5: 地址与二维码输出协议
- [x] 当二维码生成不可保证时，降级为仅输出地址并给出说明
  - Validated in Phase 5: 地址与二维码输出协议
- [x] Skill 结果遵循稳定输出协议，便于多 agent 消费
  - Validated in Phase 5: 地址与二维码输出协议
- [x] 主输出契约收敛为 `route_summary/address/eta/notes` 四字段
  - Validated in Phase 6: 输出主契约重置
- [x] A-G 退化为兼容视图，不再作为主契约字段源
  - Validated in Phase 6: 输出主契约重置

### Active

- [ ] 输出失败兜底说明，覆盖内置浏览器无法唤起等常见场景
- [ ] 定义 v1.0 -> v1.1 迁移规则（字段保留/删除/重命名）
- [ ] 完成兼容层映射文档，避免旧输出结构与主契约混用

### Out of Scope

- 静默推送到 Android 高德 App — 约束要求仅支持点击/扫码触发
- 真实消息发送（含 Telegram 推送）— 当前版本不需要
- 实时调用外部 API 拉取 POI/路况 — 当前 skill 模式以离线推理为主
- 多地图服务混用（百度/Google）— 当前优先高德能力路径

## Context

- 使用场景：聊天机器人、命令行 Agent 输出后由用户点击或扫码执行
- 能力路径：优先 `AMAP-Demo/amap-sdk-skills` 与 `AMap URI API`
- 输出目标：可读、可执行、可复制，且在移动端有可预期的唤起行为
- 交付形态：仓库内 skill 规范与提示模板，不是单独部署系统

## Current State

- Phase 1 complete: 输入契约与缺失处理
- Phase 2 complete: POI 推荐策略
- Phase 3 complete: 路线编排规则
- Phase 4 complete: 高德链接构造
- Phase 5 complete: 地址与二维码输出协议
- Phase 6 complete: 输出主契约重置（四字段主契约 + schema/example/checklist）
- v1.0 shipped: 已形成可复用 skill 文档资产（协议、模板、schema、example、checklist）

## Constraints

- **Provider**: 高德优先 — 先用 `https://uri.amap.com/...`，仅在补充时给 scheme 链接
- **Encoding**: URL 参数必须编码，坐标按 GCJ-02，包含 `callnative=1`
- **Interaction**: 不执行真实请求、不发送消息；二维码图片仅在脚本能力可用时输出
- **Compatibility**: 若提供 `amapuri://` 或 `androidamap://`，必须附 `https` 兜底
- **Output Contract**: v1.1 主契约固定为 `route_summary/address/eta/notes` 四字段（A-G 仅兼容视图）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先做跨 agent skill，再考虑独立应用 | 当前目标是复用到多个 agent runtime | Active |
| 移除 Telegram 文案要求 | 新需求只关心地址与二维码输出 | Active |
| 链接优先 `https://uri.amap.com/...` | Telegram/扫码场景兼容性更好 | Active |
| 二维码能力按可用性降级 | 防止因为环境缺依赖导致输出失败 | Active |
| v1.0 结束后归档 roadmap/requirements | 控制上下文体积并保留历史快照 | Shipped |
| 下一里程碑移除二维码主契约 | 解决文档口径冲突并收敛输出字段 | Phase 6 Complete |

## Next Milestone Goals

- 完成 Phase 7 的兼容层与迁移策略（v1.0 -> v1.1）。
- 在 Phase 8 统一 `PROJECT/ROADMAP/REQUIREMENTS/AGENTS` 对输出结构的表述。
- 固化跨 runtime 的迁移校验与回归检查流程。

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements validated? → Move to Validated with phase reference
2. Requirements changed? → Update Active/Out of Scope
3. Current State drifted? → Refresh Current State section

---
*Last updated: 2026-04-27 after phase 6 completion*
