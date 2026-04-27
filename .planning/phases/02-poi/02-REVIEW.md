---
phase: 02-poi
reviewed: 2026-04-26T06:11:45Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .planning/phases/02-poi/02-POI-STRATEGY.md
  - .planning/phases/02-poi/02-POI-REASON-TEMPLATE.md
  - .planning/phases/02-poi/02-POI-OUTPUT.schema.json
  - .planning/phases/02-poi/02-POI-OUTPUT.example.json
findings:
  critical: 0
  warning: 6
  info: 1
  total: 7
status: issues_found
---
# Phase 2: Code Review Report

**Reviewed:** 2026-04-26T06:11:45Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed Phase 2 POI strategy/template documents and the schema/example contract. No security-critical issues were found, but there are multiple contract-consistency gaps that can allow invalid or contradictory POI output to pass validation.

## Warnings

### WR-01: Example Root Shape Does Not Match Schema Contract

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:5`
**Issue:** Schema root requires a single POI output object (`trip_context`, `poi_candidates`, `ranking_metadata`, `output_views`, `metadata`), but example root is a wrapper with `normal_case` and `insufficient_case` objects (`.planning/phases/02-poi/02-POI-OUTPUT.example.json:2`, `:104`). This breaks direct schema validation of the example file.
**Fix:**
```json
{
  "oneOf": [
    { "$ref": "#/$defs/poi_output" },
    {
      "type": "object",
      "required": ["normal_case", "insufficient_case"],
      "properties": {
        "normal_case": { "$ref": "#/$defs/poi_output" },
        "insufficient_case": { "$ref": "#/$defs/poi_output" }
      },
      "additionalProperties": false
    }
  ]
}
```
Or split examples into two separate instance files that each match the current root schema.

### WR-02: `reason_template_id` Allows Undefined Templates

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:128`
**Issue:** Pattern `^R[1-9][0-9]*$` accepts `R6+`, but the template file only defines `R1..R5` (`.planning/phases/02-poi/02-POI-REASON-TEMPLATE.md:16-25`). This allows dangling template references.
**Fix:**
```json
"reason_template_id": {
  "type": "string",
  "enum": ["R1", "R2", "R3", "R4", "R5"]
}
```
If future template IDs are needed, update schema enum and template file in one atomic change.

### WR-03: Insufficient Mode Is Not Coupled to `trip_context` State

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:299`
**Issue:** `candidate_count_mode = insufficient` enforces item count and insufficiency flags, but does not require `trip_context.information_status` to be `incomplete/conflicted` or require missing-key evidence. Contradictory payloads can pass.
**Fix:**
```json
{
  "if": {
    "properties": {
      "ranking_metadata": {
        "properties": { "candidate_count_mode": { "const": "insufficient" } }
      }
    }
  },
  "then": {
    "properties": {
      "trip_context": {
        "properties": {
          "information_status": { "enum": ["incomplete", "conflicted"] },
          "missing_key_fields": { "minItems": 1 }
        },
        "required": ["information_status", "missing_key_fields"]
      }
    }
  }
}
```

### WR-04: `same_city` Flag Can Contradict Candidate `city`

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:91`
**Issue:** `same_city` is independent from candidate `city` and `trip_context.target_city` (`:30`, `:83`), so a payload can claim `same_city=true` while city differs. This undermines D-05/D-08 gating.
**Fix:** Treat `same_city` as derived, not input. Compute it in pipeline as `candidate.city === trip_context.target_city`; either remove it from schema input, or validate with post-schema business rules.

### WR-05: Ranking Integrity Is Under-Constrained

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:95`
**Issue:** `rank` only has `minimum: 1`; duplicates, gaps, or non-monotonic ordering are currently valid. This can break downstream route-building assumptions.
**Fix:** Add a post-validation invariant check:
```ts
// ranks must be 1..N and unique, and array order should match rank asc
const ranks = poiCandidates.map((c) => c.rank);
assert.deepStrictEqual([...new Set(ranks)].sort((a, b) => a - b), [1, 2, ...Array(ranks.length - 2).fill(0).map((_, i) => i + 3)]);
assert(poiCandidates.every((c, i) => c.rank === i + 1));
```

### WR-06: Cross-City Ordering Rule Is Declared But Not Enforced

**File:** `.planning/phases/02-poi/02-POI-OUTPUT.schema.json:186`
**Issue:** `cross_city_after_same_city: true` is constant metadata, but candidate ordering is not validated against this rule. A cross-city item could appear before same-city candidates.
**Fix:** Add a post-validation rule: once `same_city=false` appears, no later candidate may have `same_city=true`.

## Info

### IN-01: Dedupe Policy Is Not Machine-Enforced

**File:** `.planning/phases/02-poi/02-POI-STRATEGY.md:39`
**Issue:** Strategy defines dedupe as `同名 + 近地址`, but schema only models `dedupe_key` as a free string (`.planning/phases/02-poi/02-POI-OUTPUT.schema.json:104`) and does not enforce uniqueness across candidates.
**Fix:** Add a validator step that checks dedupe collisions by normalized `(name, normalizedAddress)`; keep `dedupe_key` as trace metadata only.

---

_Reviewed: 2026-04-26T06:11:45Z_
_Reviewer: Codex (gsd-code-reviewer)_
_Depth: standard_
