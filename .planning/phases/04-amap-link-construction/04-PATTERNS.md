# Phase 4: 高德链接构造 - Pattern Map

**Mapped:** 2026-04-27
**Files analyzed:** 4
**Analogs found:** 4 / 4

## File Classification

Derived from `04-CONTEXT.md` decisions D-01~D-13 and Phase 4 scope in `ROADMAP.md`.

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/phases/04-amap-link-construction/04-AMAP-URI-CONTRACT.md` | config | transform | `.planning/phases/04-amap-link-construction/04-CONTEXT.md` | exact |
| `.planning/phases/04-amap-link-construction/04-LINK-BUILD-ALGORITHM.md` | utility | transform | `.planning/ROADMAP.md` | role-match |
| `.planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` | docs | request-response | `.planning/REQUIREMENTS.md` | role-match |
| `.planning/phases/04-amap-link-construction/04-AMAP-LINK-VALIDATION-CHECKLIST.md` | test | validation | `.planning/config.json` | partial |

## Pattern Assignments

### `.planning/phases/04-amap-link-construction/04-AMAP-URI-CONTRACT.md` (config, transform)

**Analog:** `.planning/phases/04-amap-link-construction/04-CONTEXT.md`

**Decision block pattern** (lines 14-52):
```markdown
## Implementation Decisions

### URI 主路径与参数基线
- **D-01:** ...
- **D-02:** ...
```

**Canonical reference pattern** (lines 56-70):
```markdown
## Canonical References

**Downstream agents MUST read these before planning or implementing.**
```

**Action to copy:** Keep D-xx numbered constraints and map each URI rule back to a decision ID.

---

### `.planning/phases/04-amap-link-construction/04-LINK-BUILD-ALGORITHM.md` (utility, transform)

**Analog:** `.planning/ROADMAP.md`

**Ordered stage pattern** (lines 53-59):
```markdown
### Phase 4: 高德链接构造
Goal: ...
Requirements: AMAP-01, AMAP-02, AMAP-03, AMAP-04
```

**Action to copy:** Keep deterministic step order (`L0` then `L1..Ln`) and explicit dependencies.

---

### `.planning/phases/04-amap-link-construction/04-AMAP-LINK-EXAMPLES.md` (docs, request-response)

**Analog:** `.planning/REQUIREMENTS.md`

**Requirement mapping pattern** (lines 28-31):
```markdown
- [ ] **AMAP-01**: ...
- [ ] **AMAP-02**: ...
- [ ] **AMAP-03**: ...
- [ ] **AMAP-04**: ...
```

**Action to copy:** Every example should tag covered requirement IDs and include expected output.

---

### `.planning/phases/04-amap-link-construction/04-AMAP-LINK-VALIDATION-CHECKLIST.md` (test, validation)

**Analog:** `.planning/config.json`

**Machine-readable key/value pattern** (lines 1-22):
```json
{
  "workflow": {
    "plan_check": true
  }
}
```

**Action to copy:** Checklist items should be grep-able with explicit keys, expected values, and pass/fail.

## Shared Patterns

### Scope Guard
**Sources:** `AGENTS.md`, `.planning/PROJECT.md`
**Apply to:** All phase-4 artifacts
```markdown
- 当前仓库目标是可复用 skill，不是独立 App
- 当前阶段不做真实请求、不发送消息、不生成真实二维码图片
```

### AMap URL Baseline
**Sources:** `.planning/REQUIREMENTS.md`, `.planning/phases/04-amap-link-construction/04-CONTEXT.md`
**Apply to:** Contract + algorithm + examples + checklist
```markdown
- `https://uri.amap.com/...` 为主链接
- `callnative=1` 必填
- 参数必须 URL 编码
- 若附带 scheme，必须保留 https 兜底链接
```

### Ordered Segment Output
**Source:** `.planning/phases/04-amap-link-construction/04-CONTEXT.md` (D-05~D-08)
**Apply to:** Algorithm + examples
```markdown
- `L0` 输出总段链接
- `L1..Ln` 输出分段链接
- 顺序按用户确认结果，禁止自动重排
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | 当前仓库以规划文档为主，Phase 4 目标文件均可映射到现有文档模式。 |

## Metadata

**Analog search scope:** `AGENTS.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json`, `.planning/phases/04-amap-link-construction/04-CONTEXT.md`
**Files scanned:** 6
**Pattern extraction date:** 2026-04-27

