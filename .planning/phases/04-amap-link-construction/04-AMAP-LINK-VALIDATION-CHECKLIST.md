# Phase 4 AMap 链接校验清单

## 校验表

| check_id | rule | input | expected | verify_command | pass_condition | mapped_requirement |
|---|---|---|---|---|---|---|
| CHK-04-01 | 链接主路径必须为 `https://uri.amap.com/` | 示例文档中的导航链接 | 至少存在 `https://uri.amap.com/navigation` | `rg -n "https://uri.amap.com/navigation" .planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | 命令有命中行 | AMAP-01 |
| CHK-04-02 | 每条导航链接包含 `callnative=1` | 示例 1/2/3/4 | 命中 `callnative=1` | `rg -n "callnative=1" .planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | 命中行数 >= 4 | AMAP-02 |
| CHK-04-03 | 参数执行 URL 编码 | 示例 1/3/4 | 命中 `%E` 等编码片段 | `rg -n "%E|URL 编码" .planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | 同时命中编码字符或说明文本 | AMAP-02 |
| CHK-04-04 | 坐标优先（GCJ-02）规则生效 | 示例 3 | 存在 GCJ-02 与经纬度 `lon,lat` | `rg -n "GCJ-02|121\\.47370,31\\.23040|121\\.50000,31\\.24000" .planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | 坐标与 GCJ-02 均有命中 | AMAP-03 |
| CHK-04-05 | scheme 场景必须配套 https 兜底 | 示例 4 | scheme 与 https 同时出现 | `rg -n "amapuri://|https 兜底|https://uri.amap.com/navigation" .planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | 同时命中 scheme 与 https 兜底证据 | AMAP-04 |

## 执行说明

- 按 `check_id` 顺序执行 `verify_command`。
- 任一检查失败则标记 Phase 4 输出不通过，并回到对应示例修正。
- 该清单可直接被后续验证流程复用，无需人工解释规则。
