# Phase 5 最终输出模板

## 模板 1: `normal`

### Human-readable

- 路线摘要：`{{route_summary}}`
- 地址：
  - L0：`{{address.primary_link}}`
  - L1..Ln：
    - `{{address.segment_links[0]}}`
    - `{{address.segment_links[1]}}`
- 预计花费时间：`{{eta.total}}`（估算）
- 其他说明：`{{notes.text}}`
- 二维码状态：`{{qr.status}}`
  - payload_text：`{{qr.payload_text}}`

### machine-readable appendix

```json
{
  "address": {
    "primary_link": "{{address.primary_link}}",
    "segment_links": ["{{address.segment_links[0]}}", "{{address.segment_links[1]}}"]
  },
  "qr": {
    "status": "available",
    "payload_text": "{{qr.payload_text}}"
  },
  "consistency": {
    "payload_equals_primary_link": true
  },
  "degrade_reason": ""
}
```

## 模板 2: `address_only_degraded`

### Human-readable

- 路线摘要：`{{route_summary}}`
- 地址：
  - L0：`{{address.primary_link}}`
  - L1..Ln：
    - `{{address.segment_links[0]}}`
    - `{{address.segment_links[1]}}`
- 预计花费时间：`{{eta.total}}`（估算）
- 其他说明：二维码当前不可用，已提供可复制地址链接。`{{notes.degrade_reason}}`
- 二维码状态：`{{qr.status}}`
  - payload_text：`(empty)`

### machine-readable appendix

```json
{
  "address": {
    "primary_link": "{{address.primary_link}}",
    "segment_links": ["{{address.segment_links[0]}}", "{{address.segment_links[1]}}"]
  },
  "qr": {
    "status": "unavailable",
    "payload_text": ""
  },
  "consistency": {
    "payload_equals_primary_link": false
  },
  "degrade_reason": "{{notes.degrade_reason}}"
}
```

## A-G 兼容渲染示例

- A 段：假设与边界（无实时请求、无消息发送、无二维码图片）
- B 段：路线摘要（`route_summary`）
- C 段：地址（L0 + L1..Ln）
- D 段：预计耗时（`eta`）
- E 段：二维码状态说明（可为文本状态，不要求二维码图片）
- F 段：降级或风险说明（`notes`）
- G 段：machine-readable appendix

## OUT 需求映射

- OUT-01：地址为主交付，模板固定输出 L0 + L1..Ln。
- OUT-02：`normal` 模板在二维码可用时输出 `status + payload_text`。
- OUT-03：附录提供 `consistency.payload_equals_primary_link` 字段。
- OUT-04：`address_only_degraded` 模板固定降级文案并保留地址可复制性。
