# Phase 5 输出验证清单

## 校验表

| check_id | rule | input | verify_command | pass_condition | mapped_requirement |
|---|---|---|---|---|---|
| CHK-05-01 | 地址段是主交付，且 `primary_link` 以 `https://uri.amap.com/` 开头 | `05-OUTPUT.example.json` + `05-OUTPUT.schema.json` | `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json','utf8')); const ok=['normal_case','degraded_case'].every(k => d[k].address.primary_link.startsWith('https://uri.amap.com/')); if(!ok) process.exit(1); console.log('chk-05-01-pass');"` | 输出 `chk-05-01-pass` | OUT-01 |
| CHK-05-02 | `normal_case` 下二维码文本可用并存在 `payload_text` | `05-OUTPUT.example.json` | `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json','utf8')); const ok=d.normal_case.qr.status==='available' && !!d.normal_case.qr.payload_text; if(!ok) process.exit(1); console.log('chk-05-02-pass');"` | 输出 `chk-05-02-pass` | OUT-02 |
| CHK-05-03 | 一致性字段为真且比较方法固定 `utf8_byte_compare` | `05-OUTPUT.example.json` | `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json','utf8')); const q=d.normal_case.qr; const ok=q.payload_equals_primary_link===true && q.consistency_check_method==='utf8_byte_compare'; if(!ok) process.exit(1); console.log('chk-05-03-pass');"` | 输出 `chk-05-03-pass` | OUT-03 |
| CHK-05-04 | `degraded_case` 下二维码不可用但地址完整，且有 `degrade_reason` | `05-OUTPUT.example.json` | `node -e "const fs=require('fs'); const d=JSON.parse(fs.readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json','utf8')); const c=d.degraded_case; const ok=c.qr.status==='unavailable' && c.address.primary_link && c.address.segment_links.length>0 && !!c.notes.degrade_reason; if(!ok) process.exit(1); console.log('chk-05-04-pass');"` | 输出 `chk-05-04-pass` | OUT-04 |

## 辅助核查

- 关键字段快速命中：
  - `rg -n "https://uri.amap.com/|available|unavailable|payload_equals_primary_link|utf8_byte_compare|degrade_reason|segment_links" .planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json`
- schema 与 example JSON 语法：
  - `node -e "JSON.parse(require('fs').readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.schema.json','utf8')); JSON.parse(require('fs').readFileSync('.planning/phases/05-address-and-qr-output-protocol/05-OUTPUT.example.json','utf8')); console.log('json-ok');"`

## 执行顺序

1. 先执行 CHK-05-01 和 CHK-05-02，确认主交付与二维码可用路径。
2. 执行 CHK-05-03，确认 OUT-03 的一致性断言。
3. 执行 CHK-05-04，确认降级路径 address-only 可用。
4. 任一失败时回到 `05-OUTPUT.schema.json` / `05-OUTPUT.example.json` 修正后重测。
