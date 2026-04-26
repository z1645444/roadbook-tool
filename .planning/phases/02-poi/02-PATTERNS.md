# Phase 2: POI 推荐策略 - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

Derived from `02-CONTEXT.md` decisions D-01~D-20 and established phase-1 delivery style
(docs + schema + example, no runtime source files in repo).

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/02-poi/02-POI-STRATEGY.md` | config | transform | `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` | exact |
| `.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md` | utility | request-response | `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` | exact |
| `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` | model | transform | `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json` | exact |
| `.planning/phases/02-poi/02-POI-OUTPUT.example.json` | model | transform | `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.example.json` | exact |

## Pattern Assignments

### `.planning/phases/02-poi/02-POI-STRATEGY.md` (config, transform)

**Analog:** `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md`

**Decision block structure** (lines 12-27):
```markdown
## Decision Blocks

### Input Channels and Precedence
- **D-01**: ...
- **D-02**: ...

### Missing and Default Rules
- **D-04**: ...
```

**Normalized behavior section pattern** (lines 61-77):
```markdown
## Normalization Contract

Downstream phases consume the normalized payload in this deterministic key order:
1. ...
2. ...

Required behavior:
- Include `assumptions[]` ...
- Include `candidates[]` ...
- Keep missing-field handling non-blocking.
```

**Traceability table pattern** (lines 84-102):
```markdown
## Decision Traceability

| Decision | Section |
|----------|---------|
| D-01 | ... |
| D-02 | ... |
```

**Action to copy for phase 2:** Keep D-xx grouped sections for
“候选生成/排序/理由/去重/低置信”, then add a decision traceability table so D-01~D-20 can be
validated line-by-line by planner and verifier.

---

### `.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md` (utility, request-response)

**Analog:** `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md`

**Numbered template pattern** (lines 6-20):
```markdown
## Template

A1. ...
A2. ...
A3. ...
...
```

**Requirement traceability section** (lines 22-25):
```markdown
## Requirement Traceability

- INT-02: ...
- INT-03: ...
```

**Machine-readable appendix placeholder** (lines 27-38):
```json
{
  "assumptions": [
    { "id": "A1", "statement": "..." }
  ],
  "notes": {
    "machine-readable": true
  }
}
```

**Action to copy for phase 2:** Use stable numbered reason templates and a machine-readable appendix
placeholder for low-confidence markers and “补充信息建议(1-2条)” so downstream phase can consume it.

---

### `.planning/phases/02-poi/02-POI-OUTPUT.schema.json` (model, transform)

**Analog:** `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json`

**Strict required-key pattern** (lines 6-13):
```json
"required": [
  "trip_intent",
  "assumptions",
  "candidates",
  "output_views",
  "metadata"
],
"additionalProperties": false
```

**Candidate item constraint pattern** (lines 90-121):
```json
"candidates": {
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "required": ["name", "city", "reason", "rank", "selected"],
    "additionalProperties": false
  }
}
```

**Conditional metadata rule pattern** (lines 166-181):
```json
"allOf": [
  {
    "if": { "properties": { "cross_city": { "const": true } } },
    "then": { "required": ["cross_city_note"] }
  }
]
```

**Action to copy for phase 2:** Keep strict `required + additionalProperties:false` style; add phase-2
fields for low-confidence flags, diversity/de-dup markers, and “信息不足” state as explicit typed fields,
not implicit text.

---

### `.planning/phases/02-poi/02-POI-OUTPUT.example.json` (model, transform)

**Analog:** `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.example.json`

**Deterministic top-level order pattern** (lines 2-77):
```json
{
  "trip_intent": { ... },
  "assumptions": [ ... ],
  "candidates": [ ... ],
  "output_views": { ... },
  "metadata": { ... }
}
```

**Candidate list expression pattern** (lines 38-60):
```json
"candidates": [
  { "name": "...", "city": "...", "reason": "...", "rank": 1, "selected": true },
  { "name": "...", "city": "...", "reason": "...", "rank": 2, "selected": false }
]
```

**Human + machine dual-view pattern** (lines 61-77):
```json
"output_views": {
  "human_primary": "...",
  "machine_readable_appendix": { ... }
},
"metadata": {
  "cross_city": true,
  "cross_city_note": "...",
  "same_city_first": true
}
```

**Action to copy for phase 2:** Example must demonstrate both normal `3-5` candidates and degraded
`2-3 + 信息不足` behavior, while preserving fixed key order and machine-readable appendix.

## Shared Patterns

### Scope and Boundary Guard
**Sources:** `AGENTS.md` (lines 9-12), `02-CONTEXT.md` (lines 9-11)  
**Apply to:** All phase-2 artifacts
```markdown
- 当前仓库目标是实现可复用 skill，而不是独立 App。
- 当前交互阶段不执行真实请求...
- 本阶段不包含路线编排、URI 构造、二维码输出与外部实时 API 请求。
```

### Non-blocking Degrade Strategy
**Sources:** `01-INPUT-CONTRACT.md` (lines 23-27, 73-76), `02-CONTEXT.md` (lines 19, 42-45)  
**Apply to:** strategy, template, schema, example
```markdown
- Missing/low-confidence does not block output generation.
- Degrade behavior is explicit and machine-readable.
```

### Verification Command Pattern
**Sources:** `01-02-PLAN.md` (lines 94-100, 126-133), `01-VERIFICATION.md` (lines 67-71)  
**Apply to:** schema/example artifacts in phase 2
```bash
node -e "JSON.parse(fs.readFileSync('<schema-or-example>','utf8'))"
rg -n "<required-keys-or-signals>" <file>
node -e "<Ajv validate schema+example>"
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | Phase 2 implied artifacts align directly with phase-1 doc/template/schema/example patterns. |

## Metadata

**Analog search scope:** `.planning/phases/01-input-contract-missing-assumptions/*`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `AGENTS.md`  
**Files scanned:** 13  
**Pattern extraction date:** 2026-04-26
