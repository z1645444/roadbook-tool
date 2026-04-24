# 高德路线助手 Skill

## What This Is

这是一个给 `openclaw`、`hermes`、`claude code`、`codex` 等 agent 运行时复用的 skill，
用于把用户的自然语言出行需求转换为可执行的高德路线输出。
它不是独立 App，不负责界面、账号体系或后台服务，只负责稳定生成可直接使用的文本结果。

## Core Value

在输入不完整的情况下，稳定产出可直接使用的高德地址链接；若二维码生成不可保证，则至少输出可复制地址。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 将自然语言需求解析为结构化意图（起点、终点、途经点、偏好、预算、城市）
- [ ] 输入缺失时在输出 A 段明确假设与缺失信息，不中断结果生成
- [ ] 生成 3-5 个候选 POI，并给出可读的推荐理由
- [ ] 生成最终路线顺序，并给出每段方式与简要耗时
- [ ] 输出可唤起高德的 `https://uri.amap.com/...` 完整链接，参数可用
- [ ] 优先输出地址与二维码内容文本（二维码图片为可选能力）
- [ ] 当二维码生成不可保证时，降级为仅输出地址并给出说明
- [ ] 输出失败兜底说明，覆盖内置浏览器无法唤起等常见场景
- [ ] Skill 结果遵循稳定输出协议，便于多 agent 消费

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

## Constraints

- **Provider**: 高德优先 — 先用 `https://uri.amap.com/...`，仅在补充时给 scheme 链接
- **Encoding**: URL 参数必须编码，坐标按 GCJ-02，包含 `callnative=1`
- **Interaction**: 不执行真实请求、不发送消息；二维码图片仅在脚本能力可用时输出
- **Compatibility**: 若提供 `amapuri://` 或 `androidamap://`，必须附 `https` 兜底
- **Output Contract**: 输出采用固定结构（不再强制 A-G 七段）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 先做跨 agent skill，再考虑独立应用 | 当前目标是复用到多个 agent runtime | — Pending |
| 移除 Telegram 文案要求 | 新需求只关心地址与二维码输出 | — Pending |
| 链接优先 `https://uri.amap.com/...` | Telegram/扫码场景兼容性更好 | — Pending |
| 二维码能力按可用性降级 | 防止因为环境缺依赖导致输出失败 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-24 after scope update*
