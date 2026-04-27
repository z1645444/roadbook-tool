# 06 输出主契约 v1.1 验证清单

| check_id | rule | input | verify_command | pass_condition | mapped_requirement |
|----------|------|-------|----------------|----------------|--------------------|
| CHK-06-01 | schema 顶层 required 仅包含 `route_summary/address/eta/notes` | `06-OUTPUT-v1.1.schema.json` | `rg -n '"required"|"route_summary"|"address"|"eta"|"notes"|"additionalProperties"' .planning/phases/06-output-contract-reset/06-OUTPUT-v1.1.schema.json` | 命中 required + 四字段 + additionalProperties=false | OC-01 |
| CHK-06-02 | 文档与模板声明固定顺序 `route_summary -> address -> eta -> notes` | `06-OUTPUT-CONTRACT-v1.1.md` + `06-OUTPUT-TEMPLATE-v1.1.md` | `rg -n 'route_summary -> address -> eta -> notes|固定顺序' .planning/phases/06-output-contract-reset/06-OUTPUT-CONTRACT-v1.1.md .planning/phases/06-output-contract-reset/06-OUTPUT-TEMPLATE-v1.1.md` | 两个文件均命中固定顺序约束 | OC-01 |
| CHK-06-03 | schema/example 不得出现二维码主字段（`qr_status`/`qr_payload_text`/`qr_image`/`ascii_qr`） | `06-OUTPUT-v1.1.schema.json` + `06-OUTPUT-v1.1.example.json` | `! rg -n '"qr"|"qr_status"|"qr_payload_text"|"qr_image"|"ascii_qr"' .planning/phases/06-output-contract-reset/06-OUTPUT-v1.1.schema.json .planning/phases/06-output-contract-reset/06-OUTPUT-v1.1.example.json` | 命令返回 0，禁用字段全部缺失 | OC-02 |
| CHK-06-04 | `normal_case` 与 `degraded_case` 都可通过 schema 校验 | `06-OUTPUT-v1.1.schema.json` + `06-OUTPUT-v1.1.example.json` | `node -e "const Ajv=require('ajv/dist/2020'); const fs=require('fs'); const b='.planning/phases/06-output-contract-reset'; const s=JSON.parse(fs.readFileSync(b+'/06-OUTPUT-v1.1.schema.json','utf8')); const d=JSON.parse(fs.readFileSync(b+'/06-OUTPUT-v1.1.example.json','utf8')); const v=new Ajv({allErrors:true,strict:false}).compile(s); for (const k of ['normal_case','degraded_case']) { if (!v(d[k])) process.exit(1); } console.log('schema-validate-ok');"` | 输出 `schema-validate-ok` | OC-01, OC-02 |

## 执行建议

1. 先跑 `CHK-06-01` 与 `CHK-06-03`，确认主字段边界与禁用字段。
2. 再跑 `CHK-06-04`，确认 normal/degraded 均通过 schema。
3. 最后跑 `CHK-06-02`，核对文档固定顺序声明与模板一致。
