# Phase 3 Route Note Template

## Scope

本模板用于 Phase 3 的 A 段与正文说明，覆盖 ROUTE-03 的兜底声明与 ROUTE-02 的分段交通方式说明，保持输出可复核、可机读。

## Template IDs

N1. A 段起点缺失声明：起点信息缺失，已按规则使用城市中心作为临时起点，请确认后可重算。  
N2. A 段终点缺失声明：终点信息缺失，已按规则使用最后一个候选 POI 作为临时终点。  
N3. A 段双缺失声明：起点与终点均缺失，当前采用“城市中心 -> 最后一个候选 POI”的兜底链路。  
N4. 正文冲突提示：你指定的交通方式与常规经验可能不一致，系统已保留原指定并追加风险提示。  
N5. 正文绕路提示：检测到非连续重复点，已保持原顺序，当前路线可能绕路。  
N6. 正文回路声明：当前路线包含回路/往返段，已按你的意图保留并显式标注。  
N7. 正文预算优先声明：回路意图与时间预算冲突，已按时间预算优先进行弱化调整。  
N8. 正文默认骑行声明：未指定的路段已按默认骑行补位。  
N9. 分段自然语言解析声明：自然语言优先输入已解析；原句为“{raw_text}”，解析结果为“{parsed_segments}”，未命中段默认骑行。

## A 段与正文固定句式

- A 段用于声明假设来源（城市中心、最后一个候选 POI、信息缺失范围）。
- 正文用于声明执行路径（每段 mode、可能绕路、预算优先调整）。
- A 段不替代正文，正文不省略 A 段假设信息。

## A-G 固定结构模板映射

- A 段：N1/N2/N3/N9
- B 段：路线摘要句（起点 -> 途经点 -> 终点）
- C 段：分段明细句（mode + duration_note）
- D 段：风险提示句（N4/N5）
- E 段：预算与回路调整句（N6/N7）
- F 段：边界说明句（不输出 URI / 不输出二维码）
- G 段：machine-readable 附录

## machine-readable appendix sample

```json
{
  "note_template_id": "N9",
  "decision_refs": ["D-05", "D-03"],
  "assumption_refs": ["A1", "A2"],
  "segment_mode_input": {
    "raw_text": "先打车到A，再骑行去B",
    "parsed_segments": [
      {"segment_index": 1, "mode": "driving"},
      {"segment_index": 2, "mode": "cycling"}
    ],
    "unmatched_segments_default_mode": "cycling"
  },
  "loop_flag": false,
  "budget_override": "budget_precedence",
  "risk_level": "medium"
}
```

## Requirement Traceability

- ROUTE-03：缺失起终点时显式兜底声明（N1/N2/N3）。
- ROUTE-02：分段方式与默认骑行补位（N8/N9）。
- ROUTE-01：重复点、回路与顺序说明（N5/N6）。

## Scope Boundary

- 本阶段不输出 URI。
- 本阶段不输出二维码。
