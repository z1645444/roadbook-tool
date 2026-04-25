# Phase 1 Input Contract

## Scope

This document defines the canonical input contract for Phase 1 (输入契约与缺失处理).
It standardizes how natural language and structured inputs are normalized, how missing
information is handled without flow interruption, and which output structure downstream
phases consume.

This phase does not execute external requests and does not produce live map calls.

## Decision Blocks

### Input Channels and Precedence

- **D-01**: Accept dual-channel input: `natural_language` and `structured_input`.
- **D-02**: Conflict rule is `structured_input > natural_language`.
- **D-03**: Location fields are text-first (`name`/`address`/`city`) with optional
  `coordinates`.

### Missing and Default Rules

- **D-04**: Missing `origin` or `destination` must be explicitly declared in assumptions.
- **D-05**: default transport mode = cycling.
- **D-06**: time budget = unbounded when missing, and must be explicitly noted.
- **D-07**: If QR capability is unavailable, degrade to address-only output with clear
  explanation.

### Disambiguation and Multi-City Rules

- **D-08**: City priority is explicit city > city parsed from text > default city.
- **D-09**: For ambiguous POIs, apply same-city-first selection then semantic/preference
  ranking, and keep alternates in `candidates[]`.
- **D-10**: Cross-city routes are allowed and must include uncertainty notice.
- **D-11**: If text location conflicts with coordinates, coordinates win and the conflict
  must be surfaced.

### Normalized Output and View Strategy

- **D-12**: Normalized result uses fixed top-level key order for stable multi-agent
  consumption.
- **D-13**: Assumptions are numbered (`A1`, `A2`, ...).
- **D-14**: `candidates[]` is required and contains both selected and alternate entries.
- **D-15**: Output strategy is human-first + machine-readable appendix.

## Canonical Input Shape

```json
{
  "natural_language": "string",
  "structured_input": {
    "origin": { "name": "string", "address": "string", "city": "string", "coordinates": "optional" },
    "destination": { "name": "string", "address": "string", "city": "string", "coordinates": "optional" },
    "waypoints": [],
    "preferences": {},
    "city": "optional"
  }
}
```

## Normalization Contract

Downstream phases consume the normalized payload in this deterministic key order:

1. `trip_intent`
2. `assumptions`
3. `candidates`
4. `output_views`
5. `metadata`

Required behavior:

- Include `assumptions[]` even when confidence is high.
- Include `candidates[]` even when one choice is clear.
- Keep missing-field handling non-blocking.
- Preserve conflict and fallback notes explicitly.

## Requirement Mapping

- **INT-01**: dual-channel parsing and normalized trip intent fields
- **INT-02**: non-blocking defaults for missing optional fields
- **INT-03**: explicit assumptions and missing-info disclosure in section A style output

## Decision Traceability

| Decision | Section |
|----------|---------|
| D-01 | Input Channels and Precedence |
| D-02 | Input Channels and Precedence |
| D-03 | Input Channels and Precedence |
| D-04 | Missing and Default Rules |
| D-05 | Missing and Default Rules |
| D-06 | Missing and Default Rules |
| D-07 | Missing and Default Rules |
| D-08 | Disambiguation and Multi-City Rules |
| D-09 | Disambiguation and Multi-City Rules |
| D-10 | Disambiguation and Multi-City Rules |
| D-11 | Disambiguation and Multi-City Rules |
| D-12 | Normalized Output and View Strategy |
| D-13 | Normalized Output and View Strategy |
| D-14 | Normalized Output and View Strategy |
| D-15 | Normalized Output and View Strategy |

## Canonical References

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phases/01-input-contract-missing-assumptions/01-CONTEXT.md`
- `.planning/phases/01-input-contract-missing-assumptions/01-PATTERNS.md`
