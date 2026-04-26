# Phase 3: 路线编排规则 - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

Derived from `03-CONTEXT.md` decisions D-01..D-13 and Roadmap Phase 3 scope
(ordered route + per-segment mode + concise duration + missing endpoint fallback).

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/03-route-rules/03-ROUTE-RULES.md` | config | transform | `.planning/phases/02-poi/02-POI-STRATEGY.md` | exact |
| `.planning/phases/03-route-rules/03-ROUTE-NOTE-TEMPLATE.md` | utility | request-response | `.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md` | role-match |
| `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.schema.json` | model | transform | `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` | exact |
| `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.example.json` | model | transform | `.planning/phases/02-poi/02-POI-OUTPUT.example.json` | exact |

## Pattern Assignments

### `.planning/phases/03-route-rules/03-ROUTE-RULES.md` (config, transform)

**Analog:** `.planning/phases/02-poi/02-POI-STRATEGY.md`

**Decision section pattern** (lines 3-9, 14-20, 25-31, 36-42, 47-53):
```markdown
## 1. ...（D-xx）
- **D-01**...
- **D-02**...

## 2. ...（D-xx）
- **D-05**...
- **D-06**...
```

**Execution notes pattern** (lines 10-13, 21-24, 43-46, 54-57):
```markdown
执行要点：
- ...
- ...
```

**Decision traceability pattern** (lines 58-81):
```markdown
## 决策追踪表（Decision Traceability: D-01..D-20）
| Decision | Rule | Requirement | Section |
|---|---|---|---|
| D-01 | ... | ... | ... |
```

**Action to copy:** Keep five grouped rule blocks + one traceability table, but replace POI semantics with route semantics:
start/waypoints/end ordering, segment-mode assignment, fallback origin/destination assumptions, loop/backtrack flags, and budget-priority adjustments.

---

### `.planning/phases/03-route-rules/03-ROUTE-NOTE-TEMPLATE.md` (utility, request-response)

**Analog:** `.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md`

**Template-ID block pattern** (lines 14-25):
```markdown
## Template IDs
R1. ...
R2. ...
R3. ...
```

**Low-confidence/risk variant pattern** (lines 26-37):
```markdown
## 低置信变体（仅低置信场景启用）
- 输出格式：`[低置信] ...`
- ...附带 1-2 条补充信息建议
```

**Machine-readable appendix pattern** (lines 50-63):
```json
{
  "reason_template_id": "R1",
  "confidence": "low",
  "supplement_suggestions": [],
  "risk_note": "..."
}
```

**Action to copy:** Keep deterministic template IDs and machine-readable appendix, but switch text payload to route notes:
fallback source note (city center / last candidate), loop/backtrack warning, and “可能绕路/时间预算优先调整” explanation.

---

### `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.schema.json` (model, transform)

**Analog:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json`

**Strict object contract pattern** (lines 7-15):
```json
"required": [
  "trip_context",
  "poi_candidates",
  "ranking_metadata",
  "output_views",
  "metadata"
],
"additionalProperties": false
```

**Per-item required fields pattern** (lines 52-74):
```json
"poi_candidates": {
  "type": "array",
  "items": {
    "type": "object",
    "required": [ ... ],
    "additionalProperties": false
  }
}
```

**Conditional branch pattern** (lines 264-391):
```json
"allOf": [
  { "if": { ... }, "then": { ... } },
  { "if": { ... }, "then": { ... }, "else": { ... } }
]
```

**Action to copy:** Use same strict schema style for route output:
top-level required keys + `additionalProperties:false`, required `segments[]` item fields (from, to, mode, duration_note), and `allOf` conditions for fallback/loop/budget-conflict flags.

---

### `.planning/phases/03-route-rules/03-ROUTE-OUTPUT.example.json` (model, transform)

**Analog:** `.planning/phases/02-poi/02-POI-OUTPUT.example.json`

**Dual-case example pattern** (lines 2-103, 104-201):
```json
{
  "normal_case": { ... },
  "insufficient_case": { ... }
}
```

**Ordered list expression pattern** (lines 8-73 and 115-164):
```json
"..._candidates": [
  { "rank": 1, ... },
  { "rank": 2, ... }
]
```

**Human + machine dual-view pattern** (lines 86-98, 177-189):
```json
"output_views": {
  "human_primary": "...",
  "machine_readable_appendix": {
    "decision_refs": ["D-.."],
    "no_live_request": true
  }
}
```

**Action to copy:** Keep normal/degraded dual-case style and human+machine dual output views, but demonstrate route-specific behavior:
ordered route with segments in normal case, and fallback origin/destination + explicit risk note in degraded case.

## Shared Patterns

### Non-blocking fallback with explicit assumptions
**Sources:** `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` (lines 23-27, 73-76), `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` (lines 8-15)  
**Apply to:** `03-ROUTE-RULES.md`, `03-ROUTE-NOTE-TEMPLATE.md`, `03-ROUTE-OUTPUT.schema.json`, `03-ROUTE-OUTPUT.example.json`
```markdown
- Missing fields must not block output.
- Fallback/default behavior must be explicitly declared.
- Assumptions remain machine-readable and traceable.
```

### Decision-ID traceability across doc/schema/example
**Sources:** `.planning/phases/02-poi/02-POI-STRATEGY.md` (lines 58-81), `.planning/phases/02-poi/02-POI-OUTPUT.example.json` (lines 89-97, 180-188)  
**Apply to:** all phase-3 artifacts
```markdown
- Rule docs keep D-xx mapping tables.
- Example `machine_readable_appendix.decision_refs` points to D-xx IDs.
```

### Scope boundary enforcement (no live request / no URI construction in this phase)
**Sources:** `AGENTS.md` (lines 9-12), `.planning/phases/03-route-rules/03-CONTEXT.md` (lines 9-13), `.planning/phases/02-poi/02-POI-STRATEGY.md` (lines 83-87)  
**Apply to:** all phase-3 artifacts
```markdown
- Reusable skill docs, not standalone app behavior.
- No live request execution.
- No URI/qrcode generation in routing phase outputs.
```

### Route-order consumer compatibility from Phase 2 output
**Sources:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` (lines 147-191), `.planning/phases/02-poi/02-VERIFICATION.md` (lines 46-49, 75)  
**Apply to:** `03-ROUTE-RULES.md`, `03-ROUTE-OUTPUT.schema.json`, `03-ROUTE-OUTPUT.example.json`
```markdown
- Consume ordered candidates as authoritative route seed.
- Preserve same-city-first/cross-city ordering semantics unless explicit phase-3 conflict rule overrides with explanation.
```

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| None | - | - | Phase 3 likely artifacts map directly to Phase 2 strategy/template/schema/example structure. |

## Metadata

**Analog search scope:** `.planning/phases/01-input-contract-missing-assumptions/*`, `.planning/phases/02-poi/*`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `AGENTS.md`  
**Files scanned:** 18  
**Pattern extraction date:** 2026-04-26
