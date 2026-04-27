# Phase 4 AMap 链接示例集

## 使用说明

- 示例用于执行与验收，不执行真实请求。
- 每个示例均标注覆盖需求（AMAP-01..AMAP-04）与校验提示。

## 示例 1：标准 https 输出（URL 编码 + callnative=1）

- 覆盖需求：AMAP-01, AMAP-02
- 输入假设：起点与终点均有文本名称，无坐标。
- 预期输出：
  - `https://uri.amap.com/navigation?from=上海%E7%AB%99&to=%E6%9D%AD%E5%B7%9E%E4%B8%9C%E7%AB%99&callnative=1`
- 校验提示：检查 `https://uri.amap.com/navigation`、`callnative=1`、编码片段 `%E`。

## 示例 2：多途经点顺序输出（L0 + L1..L5）

- 覆盖需求：AMAP-01, AMAP-02
- 输入假设：确认顺序为 `A1 -> A3 -> A2 -> B3 -> B2 -> B1`，禁止自动重排。
- 预期输出：
  - `L0`: `A1 -> B1`
  - `L1`: `A1 -> A3`
  - `L2`: `A3 -> A2`
  - `L3`: `A2 -> B3`
  - `L4`: `B3 -> B2`
  - `L5`: `B2 -> B1`
- 参考链接片段（每条均含 `from/to/callnative=1`）：
  - `https://uri.amap.com/navigation?from=A1&to=B1&callnative=1`
  - `https://uri.amap.com/navigation?from=A1&to=A3&callnative=1`
  - `https://uri.amap.com/navigation?from=A3&to=A2&callnative=1`
  - `https://uri.amap.com/navigation?from=A2&to=B3&callnative=1`
  - `https://uri.amap.com/navigation?from=B3&to=B2&callnative=1`
  - `https://uri.amap.com/navigation?from=B2&to=B1&callnative=1`
- 校验提示：检查 L0/L1..L5 命名与顺序是否完整。

## 示例 3：坐标优先（GCJ-02）文本补充

- 覆盖需求：AMAP-02, AMAP-03
- 输入假设：起终点同时存在坐标和文本，坐标为 GCJ-02。
- 预期输出：
  - `https://uri.amap.com/navigation?from=121.47370,31.23040(%E4%BA%BA%E6%B0%91%E5%B9%BF%E5%9C%BA)&to=121.50000,31.24000(%E9%99%86%E5%AE%B6%E5%98%B4)&callnative=1`
- 校验提示：优先识别坐标对，文本仅辅助展示。

## 示例 4：scheme 请求场景（双链输出）

- 覆盖需求：AMAP-01, AMAP-04
- 输入假设：用户明确要求提供 scheme。
- 预期输出：
  - scheme：`amapuri://route/plan/?sourceApplication=roadbook-tool&dlat=31.24000&dlon=121.50000`
  - https 兜底：`https://uri.amap.com/navigation?from=%E4%B8%8A%E6%B5%B7%E7%AB%99&to=%E9%99%86%E5%AE%B6%E5%98%B4&callnative=1`
- 校验提示：scheme 存在时必须同时存在 https 兜底。

## 快速检查点

- 每条导航链接包含 `https://uri.amap.com/navigation`。
- 每条导航链接包含 `callnative=1`。
- 关键文本参数为 URL 编码。
- 坐标案例明确采用 GCJ-02。
- scheme 示例包含 https 兜底。
