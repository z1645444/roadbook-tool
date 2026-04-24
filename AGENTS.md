# AGENTS.md

## Project

高德路线助手 Skill（跨 `openclaw` / `hermes` / `claude code` / `codex` 复用）

## Scope

- 当前仓库目标是实现可复用 skill，而不是独立 App。
- skill 输出必须遵循 A-G 固定结构。
- 优先输出 `https://uri.amap.com/...`，并遵守 `callnative=1`、URL 编码与兼容兜底约束。
- 当前交互阶段不执行真实请求、不发送消息、不生成真实二维码图片。

## Next Command

- `$gsd-plan-phase 1`
