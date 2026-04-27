# 06 输出模板 v1.1

## 模板原则

- v1.1 主模板仅输出四字段：`route_summary`、`address`、`eta`、`notes`。
- 两种场景（normal / degraded）都必须保持相同固定顺序。
- 顶层不允许额外主字段。

固定顺序：`route_summary -> address -> eta -> notes`

## normal

### 人类可读模板

```text
route_summary: {路线摘要}
address: {高德链接或地址文本}
eta: {预计到达/耗时}
notes: {补充说明}
```

### 机读片段示意

```json
{
  "route_summary": "从 A 到 B，优先快速路线",
  "address": "https://uri.amap.com/navigation?to=116.397428,39.90923,天安门&mode=car&policy=1&callnative=1",
  "eta": "约 28 分钟",
  "notes": "路况正常"
}
```

## degraded

### 人类可读模板

```text
route_summary: {可生成的最小路线摘要}
address: {可执行地址结果；若能力受限给出可复制文本}
eta: {可用估计；缺失时明确标记不确定}
notes: {降级原因与限制说明}
```

### 机读片段示意

```json
{
  "route_summary": "输入信息不完整，已按最小信息生成路线建议",
  "address": "https://uri.amap.com/navigation?to=116.397428,39.90923,目的地&mode=car&policy=1&callnative=1",
  "eta": "时间估计不稳定",
  "notes": "degraded: 缺少部分输入参数，已使用默认策略"
}
```

## 兼容层（非主契约）

- A-G 仅作为兼容视图，不是主契约字段源。
- 历史渲染结构和二维码相关兼容行为在 Phase 7 统一定义。
- 兼容层可以从四字段主契约派生展示，但不得反向污染主字段集合。
