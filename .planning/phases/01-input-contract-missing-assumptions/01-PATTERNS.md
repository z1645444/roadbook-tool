# Phase 1: 输入契约与缺失处理 - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

Derived from `01-CONTEXT.md` decisions D-01~D-15 and the explicit note that this phase outputs reusable
"输入契约文档与模板" (no runtime source files exist yet in this repo).

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` | config | transform | `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md` | exact |
| `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` | utility | request-response | `.planning/REQUIREMENTS.md` | role-match |
| `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.example.json` | model | transform | `.planning/ROADMAP.md` | partial |
| `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json` | model | transform | `.planning/config.json` | role-match |

## Pattern Assignments

### `.planning/phases/01-input-contract-missing-assumptions/01-INPUT-CONTRACT.md` (config, transform)

**Analog:** `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md`

**Decision block pattern** (lines 14-44):
```markdown
## Implementation Decisions

### 输入模式与字段优先级
- **D-01:** ...
- **D-02:** ...

### 缺失与默认策略
- **D-04:** ...
```

**Canonical reference pattern** (lines 54-68):
```markdown
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and constraints
- `.planning/PROJECT.md` ...
```

**Action to copy:** Keep `D-xx` numbered decisions, grouped by subheadings, with explicit downstream-readable
references and phase-scope boundaries.

---

### `.planning/phases/01-input-contract-missing-assumptions/01-ASSUMPTIONS-TEMPLATE.md` (utility, request-response)

**Analog:** `.planning/REQUIREMENTS.md`

**Requirement-ID pattern** (lines 8-13):
```markdown
### Intent Parsing

- [ ] **INT-01**: ...
- [ ] **INT-02**: ...
- [ ] **INT-03**: User receives explicit assumptions and missing information in section A
```

**Fallback/degrade wording pattern** (lines 35-39):
```markdown
- [ ] **OUT-04**: When QR cannot be guaranteed, output degrades to address-only with explanation
```

**Action to copy:** Use stable IDs and checklist-style statement lines for assumptions/missing info templates.
Keep degradation behavior explicit and non-blocking.

---

### `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.example.json` (model, transform)

**Analog:** `.planning/ROADMAP.md`

**Ordered structure pattern** (lines 24-31):
```markdown
### Phase 1: 输入契约与缺失处理
Goal: ...
Requirements: INT-01, INT-02, INT-03
Success criteria:
1. ...
2. ...
3. ...
```

**Cross-phase compatibility pattern** (lines 16-20):
```markdown
| 1 | 输入契约与缺失处理 | ... |
| 2 | POI 推荐策略 | ... |
```

**Action to copy:** Example JSON should keep deterministic field order, explicit assumption numbering, and
downstream-consumable blocks aligned with Phase 2+ consumers.

---

### `.planning/phases/01-input-contract-missing-assumptions/01-NORMALIZED-OUTPUT.schema.json` (model, transform)

**Analog:** `.planning/config.json`

**JSON object convention pattern** (lines 1-42):
```json
{
  "model_profile": "balanced",
  "workflow": {
    "research": false,
    "plan_check": true
  }
}
```

**Action to copy:** Use stable top-level keys, nested objects for grouped concerns, and explicit boolean/string
types for machine consumption.

## Shared Patterns

### Scope Guard
**Sources:** `AGENTS.md` (lines 7-12), `.planning/PROJECT.md` (lines 31-37)
**Apply to:** All phase-1 artifacts
```markdown
- 当前仓库目标是实现可复用 skill，而不是独立 App。
- 当前交互阶段不执行真实请求...
```

### Input Contract Decisions as Single Source of Truth
**Source:** `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md` (lines 16-37)
**Apply to:** Contract/spec/schema/example files
```markdown
- 双通道输入
- 显式结构化字段优先
- candidates[] 必须输出
- 自然语言优先 + 可机读补充
```

### Downstream AMap Compatibility Constraints
**Sources:** `AGENTS.md` (line 11), `.planning/PROJECT.md` (lines 47-50)
**Apply to:** Any field names or placeholders that later feed URI-building phases
```markdown
- 优先 `https://uri.amap.com/...`
- 参数编码 + `callnative=1`
- scheme 链接必须附 https 兜底
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | Repo currently has planning docs only; all phase-1 targets are documentation/schema artifacts and have partial analogs. |

## Metadata

**Analog search scope:** `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/config.json`, `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md`
**Files scanned:** 7
**Pattern extraction date:** 2026-04-24
