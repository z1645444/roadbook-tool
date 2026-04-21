# Phase 4: Lodging Recommendation Policy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves alternatives considered.

**Date:** 2026-04-21
**Phase:** 4-lodging-recommendation-policy
**Areas discussed:** Lodging retrieval strategy, Policy filtering/ranking, Fallback strategy,
Output contract

---

## Lodging Candidate Retrieval Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Retrieval anchor = overnightStopPoint | Use nightly stop only as lodging query anchor | ✓ |
| Retrieval anchor = day endPoint | Use day end point as anchor | |
| Support both anchors | Dual-mode anchor selection | |

| Option | Description | Selected |
|--------|-------------|----------|
| Initial radius 5km | Stricter local radius | |
| Initial radius 8km | Balanced coverage and proximity | ✓ |
| Initial radius 12km | Wider retrieval coverage | |

| Option | Description | Selected |
|--------|-------------|----------|
| Per-type keep top 3 | Best chat readability | ✓ |
| Per-type keep top 5 | More options, larger payload | |
| Per-type keep top 2 | Minimal output | |

| Option | Description | Selected |
|--------|-------------|----------|
| Single-page retrieval | No paging | |
| Max 2 pages + truncate by quota | Balanced recall/cost | ✓ |
| Keep paging until quota full | Highest recall, high API cost | |

| Option | Description | Selected |
|--------|-------------|----------|
| Force `sortrule=distance` | Prioritize nearby stays | ✓ |
| Provider default sort | No explicit sort rule | |
| Score-first sort | Requires more custom ranking | |

| Option | Description | Selected |
|--------|-------------|----------|
| Serial per-type queries | Stable QPS behavior | ✓ |
| Parallel with cap=2 | Faster, moderate risk | |
| Fully parallel | Fastest, highest rate risk | |

| Option | Description | Selected |
|--------|-------------|----------|
| De-dup by `providerId` | Stable identity key | ✓ |
| De-dup by `name+coords` | Heuristic identity | |
| No de-dup | Keep all candidates | |

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `MapProvider` for lodging search | Keep provider abstraction boundary | ✓ |
| Orchestrator direct HTTP to AMap | Faster but leaks provider details | |
| Separate lodging adapter outside provider port | New abstraction branch | |

| Option | Description | Selected |
|--------|-------------|----------|
| Skip single-day lodging retrieval | Phase stays nightly-stop scoped | ✓ |
| Fallback to single-day endPoint | Include one-day recommendation | |
| User-toggle behavior | Runtime mode choice | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed `types` whitelist only | Controlled category precision | ✓ |
| `types` + keyword hybrid | Wider recall, noisier | |
| Keyword-only | Low precision | |

| Option | Description | Selected |
|--------|-------------|----------|
| 3s timeout, no retry | Stable chat latency | ✓ |
| 3s timeout, one retry | Slightly more robust | |
| 5s timeout, two retries | High latency risk | |

| Option | Description | Selected |
|--------|-------------|----------|
| Cache 10 min per session+anchor | Reduce duplicate calls | ✓ |
| No cache | Always live query | |
| Cache until session end | Longer stale risk | |

**User's choice:** All selected options above (A-branch across Q1-Q12).
**Notes:** Retrieval strategy intentionally optimized for deterministic behavior and manageable
provider call volume in chat flow.

---

## Policy Filtering and Ranking

| Option | Description | Selected |
|--------|-------------|----------|
| Normalize to nightly total CNY price | Uniform policy comparison unit | ✓ |
| Keep raw provider price semantics | No normalization | |
| Normalize with fallback to raw fields | Hybrid policy | |

| Option | Description | Selected |
|--------|-------------|----------|
| Strict `rating >= 4.0` | Keep quality bar fixed | ✓ |
| Keep `3.8-3.9` as backup pool | Softer quality policy | |
| Dynamic city-based threshold | Adaptive but complex | |

| Option | Description | Selected |
|--------|-------------|----------|
| Rank: distance > rating > price | Night-stop proximity first | ✓ |
| Rank: rating > distance > price | Quality first | |
| Rank: price > distance > rating | Cost first | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed per-type quota (3 each) | Stable category representation | ✓ |
| Shared top-9 pool | Dynamic distribution | |
| Shared top-6 pool | Smaller payload | |

**User's choice:** All selected options above (A-branch across Q13-Q16).
**Notes:** Strict-policy posture retained to match phase intent and requirement wording.

---

## Fallback Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Relax order: radius -> price | Preserve quality signal first | ✓ |
| Relax order: price -> radius | Cost-first fallback | |
| Relax order: rating first | Lowers quality early | |

| Option | Description | Selected |
|--------|-------------|----------|
| Radius steps `8 -> 12 -> 20` km | Clear staged expansion | ✓ |
| Radius steps `8 -> 15` km | Coarse expansion | |
| Radius steps `8 -> 10 -> 15 -> 20` km | Fine-grained expansion | |

| Option | Description | Selected |
|--------|-------------|----------|
| Price cap `+20%` (hostel floor fixed) | Controlled fallback widening | ✓ |
| Price cap `+30%` | More aggressive widening | |
| No price relaxation | Hard fail sooner | |

| Option | Description | Selected |
|--------|-------------|----------|
| Never relax rating floor | Keep quality contract strict | ✓ |
| Final-stage `rating >= 3.8` | Mild quality relaxation | |
| Final-stage `rating >= 3.5` | Strong quality relaxation | |

**User's choice:** All selected options above (A-branch across Q17-Q20).
**Notes:** If no candidates survive all fallback stages, system returns explicit no-match result.

---

## Output Contract and Comparison Format

| Option | Description | Selected |
|--------|-------------|----------|
| Group by day + overnight stop | Matches day-stage planning model | ✓ |
| Flat lodging list | No day-level grouping | |
| Group by lodging type first | Type-centric layout | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fields: name/type/distance/rating/price/policyStage | Minimum comparable contract | ✓ |
| Fields: name/rating/price only | Too little context | |
| Extended fields incl. contact/address | Rich but heavy output | |

| Option | Description | Selected |
|--------|-------------|----------|
| Per-type section, top 3 each | Stable policy representation | ✓ |
| Global top-9 mixed list | Type boundaries blurred | |
| Per-type top 1 only | Too sparse for comparison | |

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit no-match + fallback trace | Auditable outcome | ✓ |
| Empty list only | No user guidance | |
| Generic "retry" prompt | Not actionable | |

**User's choice:** All selected options above (A-branch across Q21-Q24).
**Notes:** Output is intentionally structured for direct downstream markdown roadbook embedding.

---

## the agent's Discretion

- Internal naming for policy stage enums and cache keys.
- Exact module file split between provider adapter, policy filter, and response formatter.

## Deferred Ideas

None.
