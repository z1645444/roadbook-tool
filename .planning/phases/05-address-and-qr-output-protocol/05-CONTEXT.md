# Phase 5: 地址与二维码输出协议 - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段仅定义最终输出协议：在多 agent runtime 下稳定输出可读、可复制、可执行的路线结果文本，覆盖地址链接、预计耗时、说明信息与二维码文本能力约束。
不执行真实请求、不发送消息、不生成真实二维码图片。

</domain>

<decisions>
## Implementation Decisions

### 最终输出主协议（当前 milestone）
- **D-01:** 最终对外输出以 human-readable 自然语言为主。
- **D-02:** 对外主字段固定包含：路线摘要、地址、预计花费时间、其他说明、二维码状态。
- **D-03:** 为降低对既有 phase 资产破坏，保留 A-G 作为兼容渲染外壳；主语义按上述字段驱动。

### 地址输出协议
- **D-04:** 地址段必须输出可直接复制的 `https://uri.amap.com/...` 主链接（L0），并遵守 `callnative=1` 与 URL 编码约束。
- **D-05:** 地址段同时输出完整分段链接 `L1..Ln`（按已确认顺序）。
- **D-06:** 链接顺序为 `L0` 在前、`L1..Ln` 在后，避免下游解析歧义。

### 预计耗时协议
- **D-07:** 输出总预计时长与每段预计时长。
- **D-08:** 当前阶段不做实时拉取；耗时统一按离线估算生成，并显式标注“估算值”。
- **D-09:** 当置信度较低时，在“其他说明”中追加不确定性提示。

### 二维码文本协议（当前 milestone）
- **D-10:** 当前 milestone 保留二维码文本相关字段（最小化对既有 requirement 的破坏）。
- **D-11:** 若二维码能力可用，输出二维码状态与二维码载荷文本。
- **D-12:** 二维码载荷文本必须与地址 URL 字节级一致（OUT-03 对齐）。
- **D-13:** 当前交互阶段不输出二维码图片，也不输出 ASCII 二维码。

### 异常与降级策略
- **D-14:** 地址为必达主链路；二维码失败不得阻断地址输出。
- **D-15:** 二维码不可用时，保持路线摘要/地址/预计耗时照常输出，并在“其他说明”写明原因。
- **D-16:** 若上游输入导致地址链接不可构造，至少输出可读路线摘要与缺失说明，提示补充必要信息后重算。

### the agent's Discretion
- 具体文案模板（字段标题、换行风格、提示语气）
- 预计耗时区间展示粒度（单值或区间）
- 二维码不可用原因码的命名细节

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and acceptance
- `AGENTS.md` — 项目边界与输出约束（A-G、高德链接优先、当前阶段禁真实请求/消息/二维码图片）。
- `.planning/PROJECT.md` — 项目目标、输出契约方向与当前 active 约束。
- `.planning/REQUIREMENTS.md` — OUT-01/02/03/04 验收项定义。
- `.planning/ROADMAP.md` — Phase 5 目标、成功标准与 requirement 映射。
- `.planning/STATE.md` — 当前里程碑状态与 phase 聚焦上下文。

### Upstream phase contracts
- `.planning/phases/03-route-rules/03-CONTEXT.md` — 路线分段、方式与耗时输出口径。
- `.planning/phases/03-route-rules/03-ROUTE-RULES.md` — A-G 映射与边界声明基础。
- `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.schema.json` — 既有结构化输出字段与约束。
- `.planning/phases/04-amap-link-construction/04-CONTEXT.md` — L0/L1..Ln 链接形态与顺序约束。
- `.planning/phases/04-amap-link-construction/04-AMAP-URI-CONTRACT.md` — 高德 URI 参数契约。
- `.planning/phases/04-amap-link-construction/04-LINK-BUILD-ALGORITHM.md` — 链接构造算法细节。

### Supporting templates
- `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` — A 段假设与降级说明模板来源。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 当前仓库暂无 runtime 代码；可复用资产以 phase 文档、schema、example 为主。
- `03-ROUTE-OUTPUT.schema.json` 可作为输出字段与边界校验的结构基础。
- `04-AMAP-URI-CONTRACT.md` 与 `04-LINK-BUILD-ALGORITHM.md` 可直接复用地址链接生成规则。

### Established Patterns
- 先定义契约与模板，再做实现与验证。
- 主链路可降级但不可中断：优先保证可复制地址输出。
- 输出强调 human-readable 与 machine-readable 并存。

### Integration Points
- 消费 Phase 3 的分段耗时与风险信息，生成“预计花费时间/其他说明”。
- 消费 Phase 4 的 `L0 + L1..Ln` 链接结构，生成地址段与二维码文本载荷一致性检查。

</code_context>

<specifics>
## Specific Ideas

- 用户明确希望最终输出以自然语言可读为主。
- 用户明确要求地址字段输出主链接 + 全部分段链接（L0 + L1..Ln）。
- 用户关注“每段预计耗时是否可获取”，确认当前口径为离线估算并显式标注。
- 用户要求“最小化不破坏前面 phase”，因此当前 milestone 维持二维码文本 requirement（完整字段），并将彻底移除二维码的改动后置到下个 milestone。

</specifics>

<deferred>
## Deferred Ideas

- 下个 milestone 进行输出契约重置：A-G 调整为“路线摘要、地址、预计花费时间、其他说明”，并取消二维码相关所有信息。
- 已记录待办：`.planning/todos/pending/2026-04-27-milestone-a-g-output-contract-remove-qr.md`

</deferred>

---
*Phase: 05-address-and-qr-output-protocol*
*Context gathered: 2026-04-27*
