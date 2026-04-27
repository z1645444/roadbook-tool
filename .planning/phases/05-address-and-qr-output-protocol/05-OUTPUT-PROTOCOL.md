# Phase 5 输出协议（Address + QR）

## 1. 输出字段总览

本阶段对外主字段固定如下：

- `route_summary`
- `address`
- `eta`
- `notes`
- `qr_status`

其中 `qr_status` 与机读字段 `qr.status` 语义一致，取值统一为 `available | unavailable | not_requested`。

## 2. 地址协议

### 2.1 主链路与分段链路

- `address.primary_link` 必须为 `L0`，且必须是可复制的 `https://uri.amap.com/...`。
- `address.segment_links` 必须为 `L1..Ln` 数组。
- 输出顺序固定：`L0` 在前，`L1..Ln` 在后。

### 2.2 链接约束

- 每条链接必须满足 `callnative=1`。
- 参数必须执行 `URL 编码`。
- 地址段必须可直接复制，不依赖外部二次加工。

## 3. 二维码状态矩阵

| qr_status | 含义 | 是否允许 `qr_payload_text` |
|---|---|---|
| `available` | 二维码文本能力可用 | 必须提供 |
| `unavailable` | 二维码文本能力不可用 | 不提供 |
| `not_requested` | 当前会话未请求二维码文本 | 不提供 |

## 4. 一致性规则（OUT-03）

- 当 `qr_status=available` 时，`qr_payload_text` 必须与 `address.primary_link` 做 `UTF-8` `字节级一致` 校验。
- 若不一致，判定本次输出不通过，需回退修正。

## 5. 降级规则（OUT-04）

- 二维码失败不得阻断主流程。
- 当状态为 `unavailable` 时，必须降级为 `address-only` 输出。
- 降级时保留 `route_summary`、`address`、`eta`，并在 `notes` 中写明“二维码不可用”的原因。
- `降级` 仅影响二维码文本，不影响地址必达交付。

## 6. A-G 兼容映射

- `A=假设与边界`
- `B=路线摘要`
- `C=地址`
- `D=预计耗时`
- `E=二维码状态`
- `F=降级与风险说明`
- `G=机读附录`

## 7. 范围边界

- 不执行真实请求
- 不发送消息
- 不生成二维码图片
- 不生成 ASCII 二维码

## 8. OUT 需求追踪

| Requirement | 协议条款 | 验收要点 |
|---|---|---|
| OUT-01 | §2 地址协议 | 地址段主交付，固定 `L0 + L1..Ln` |
| OUT-02 | §3 状态矩阵 | `available` 时提供二维码文本 |
| OUT-03 | §4 一致性规则 | `qr_payload_text` 与主链路字节一致 |
| OUT-04 | §5 降级规则 | 二维码异常时保持 address-only 且有说明 |
