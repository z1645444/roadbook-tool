# Domain Pitfalls

**Domain:** Chat-first cycling roadbook planning with AMap route + POI data (China-first)
**Researched:** 2026-04-20

## Critical Pitfalls

### Pitfall 1: Coordinate-System Drift (WGS84/GCJ-02 mix-ups)
**What goes wrong:** Route legs, POI anchors, and user-provided points silently misalign by hundreds of meters when different coordinate systems are mixed.
**Why it happens:** AMap APIs are GCJ-02-centric; chat inputs may come from mixed sources (device share links, copied coordinates, other map exports).
**Consequences:** Wrong waypoint snaps, incorrect lodging proximity, unsafe or impractical roadbook instructions.

**Warning signs (early detection):**
- Same point resolves to different nearby roads across requests.
- Lodging “near route” appears visually far from planned segment.
- Frequent manual corrections from users: “That point is not where I meant.”

**Prevention strategy:**
- Define one canonical internal coordinate standard for v1 (GCJ-02 for AMap integration layer).
- Add explicit input normalization pipeline: detect source format, convert once, persist original + normalized coordinates.
- Store and expose coordinate metadata (`source`, `converted`, `precision`) in debug logs and internal trace.
- Add regression tests for round-trip conversion and tolerance thresholds.

**Which phase should address it:**
- Phase 1 (foundation): coordinate normalization and data contracts.
- Phase 2 (routing integration): conversion tests and route/POI consistency checks.

---

### Pitfall 2: Chat Ambiguity Producing False-Precision Plans
**What goes wrong:** The assistant generates “precise” day plans from underspecified user intent (unclear city, waypoint semantics, preferred road types, date/weather context).
**Why it happens:** Chat interfaces encourage implicit assumptions; route engines still require explicit, disambiguated parameters.
**Consequences:** High-confidence but unusable roadbooks, user trust collapse, repeated replanning churn.

**Warning signs (early detection):**
- High replan rate after first itinerary draft.
- User follow-ups dominated by corrections (“not this city”, “avoid highways”, “I only ride mornings”).
- Many geocode results with equally plausible candidates.

**Prevention strategy:**
- Implement mandatory slot confirmation before route commit: origin/destination city, waypoints, daily window, intensity, hard constraints.
- Use confidence-gated clarification prompts: if geocode/intent confidence below threshold, ask before planning.
- Render assumptions section in the roadbook (“Assumed constraints”) and require explicit confirmation for low-confidence fields.
- Track “assumption override rate” as product KPI.

**Which phase should address it:**
- Phase 1 (conversation contract): slot schema + confirmation policy.
- Phase 3 (roadbook UX): assumption visibility + revision workflow.

---

### Pitfall 3: Routing Nondeterminism Ignored (Same query, different route)
**What goes wrong:** The same O/D/waypoint query returns different paths over time but system treats output as deterministic truth.
**Why it happens:** Official AMap docs note route results may vary due to real-time and dynamic conditions.
**Consequences:** Inconsistent roadbooks, “why did this change?” support burden, broken reproducibility.

**Warning signs (early detection):**
- Snapshot tests for route legs fail without code changes.
- Users comparing regenerated plans see unexplained route shifts.
- Duration/distance volatility spikes on repeated calls.

**Prevention strategy:**
- Version route artifacts with query timestamp + provider response hash.
- Separate “planning-time estimate” from “execution-time recheck” in output.
- Add tolerances for route drift (distance/time bands) and automatic revalidation window before trip date.
- Preserve last-known-good itinerary unless user requests refresh.

**Which phase should address it:**
- Phase 2 (routing service): artifact versioning + drift policy.
- Phase 4 (operational hardening): monitoring and revalidation scheduler.

---

### Pitfall 4: POI Quality Assumptions (ratings/prices stale or inconsistent)
**What goes wrong:** Lodging recommendations rely on noisy fields (rating counts, stale prices, category mismatch) as if fully reliable.
**Why it happens:** POI data quality varies by region/time; price may not reflect current availability; category labels can be coarse.
**Consequences:** “Good-score low-price” picks that are unavailable or unsuitable for cyclists; credibility loss.

**Warning signs (early detection):**
- High user complaint rate on recommendation relevance.
- Many recommended POIs missing key fields (price, ratings count, opening status).
- Same lodging appears with inconsistent metadata across calls.

**Prevention strategy:**
- Build a reliability score per POI (field completeness + recency + cross-signal checks).
- Use minimum-review-count thresholds, not rating alone.
- Mark price/rating uncertainty explicitly in roadbook output.
- Prefer top-N candidates with diversity and fallback options over single “best” recommendation.

**Which phase should address it:**
- Phase 2 (POI integration): data quality scoring.
- Phase 3 (recommendation policy): ranking + uncertainty presentation.

---

### Pitfall 5: Quota/Auth Failure Not Designed as First-Class Path
**What goes wrong:** API key limits, signature/auth errors, or service throttling turn into hard failures mid-conversation.
**Why it happens:** Teams design only happy path and add resilience later.
**Consequences:** Planner becomes brittle during load spikes; user sessions fail without recovery path.

**Warning signs (early detection):**
- Rising frequency of AMap error codes (quota/auth/request-limit categories).
- Conversation drop-off right after route/POI steps.
- Retry storms causing cascading failures.

**Prevention strategy:**
- Classify provider errors into retryable vs non-retryable with explicit user-facing fallback messages.
- Add circuit breaker + bounded retry + jitter; cache safe intermediate artifacts.
- Implement per-user/session rate budgeting and queueing.
- Expose provider health dashboard and alerting on error-code clusters.

**Which phase should address it:**
- Phase 2 (integration resilience): error taxonomy + fallback flows.
- Phase 4 (SRE/ops): alerting, rate controls, incident runbooks.

---

### Pitfall 6: Waypoint Optimization Without Human Constraints
**What goes wrong:** TSP-style optimization minimizes distance/time but violates cyclist realities (climb burden, road safety preference, rest-stop spacing).
**Why it happens:** Optimization objective is too narrow and ignores rider-specific constraints.
**Consequences:** Mathematically “optimal” but physically unreasonable plans; abandonment at execution stage.

**Warning signs (early detection):**
- User feedback: “too hard despite standard intensity.”
- Day segments with extreme variance (one overload day, one trivial day).
- Frequent manual reordering by users.

**Prevention strategy:**
- Use multi-objective scoring: distance + duration + elevation proxy + daily load smoothness.
- Enforce hard caps per intensity profile and reject plans that violate caps.
- Provide “why this order” explanation and editable waypoint-lock feature.
- Include recovery-day heuristics for multi-day trips.

**Which phase should address it:**
- Phase 3 (planning engine): multi-objective optimization + explainability.
- Phase 5 (quality iteration): calibration from real trip feedback.

---

### Pitfall 7: Safety and Legality Blind Spots in Route Output
**What goes wrong:** Generated roadbook can include segments that are legally restricted or practically unsafe for cycling.
**Why it happens:** Mapping APIs optimize for route feasibility but not complete cycling safety semantics in all contexts.
**Consequences:** Real-world rider risk and severe trust/safety liability.

**Warning signs (early detection):**
- Segment-level reports from users about unsafe roads/ramps/tunnels.
- High frequency of manual “avoid this section” edits.
- Route segments with anomalous speed assumptions for cycling.

**Prevention strategy:**
- Add route safety filters and blacklist/avoid rules for known problematic segment types.
- Require explicit safety disclaimer + pre-ride verification checklist in output.
- Add “human-in-the-loop” override for flagged segments.
- Maintain incident feedback loop that updates avoidance heuristics.

**Which phase should address it:**
- Phase 3 (roadbook generation): safety policy + checks.
- Phase 5 (post-launch learning): incident ingestion and rule updates.

---

### Pitfall 8: Markdown Roadbook Without Machine-Readable Backbone
**What goes wrong:** Output looks good for humans but cannot be diffed, validated, or safely revised by system workflows.
**Why it happens:** Markdown-only delivery skips canonical structured representation.
**Consequences:** Fragile edits, hard regression testing, poor auditability across replans.

**Warning signs (early detection):**
- Minor text edits break downstream parsing.
- Difficult to compare versions beyond manual reading.
- Inability to validate itinerary invariants automatically.

**Prevention strategy:**
- Treat Markdown as view layer; maintain canonical JSON itinerary schema.
- Generate markdown from schema with deterministic renderer.
- Add schema-level validators (daily cap, waypoint order, lodging constraints).
- Store both machine artifact and rendered output with shared version id.

**Which phase should address it:**
- Phase 1 (data model): canonical itinerary schema.
- Phase 3 (output system): deterministic render pipeline.

---

## Moderate Pitfalls

### Pitfall: Geocoding Ambiguity in Chinese Place Names
**What goes wrong:** Same place name maps to multiple cities/districts, causing silent misrouting.
**Prevention:** Force city/district disambiguation when confidence low; add administrative-area confirmation step.
**Phase:** Phase 1-2.

### Pitfall: Token-Cost Explosion from Iterative Replanning in Chat
**What goes wrong:** Long chat sessions repeatedly call route + POI APIs and LLM turns.
**Prevention:** Session-level memoization, change-impact planning (recompute only affected legs), concise state summaries.
**Phase:** Phase 2-4.

## Minor Pitfalls

### Pitfall: Unit/Locale Mismatch
**What goes wrong:** km/hours vs meters/minutes confusion in prompts and output.
**Prevention:** Normalize units internally; show explicit units in every constraint and segment.
**Phase:** Phase 1.

### Pitfall: Overly Strict Lodging Filters Yield Empty Results
**What goes wrong:** Hard thresholds (rating/price) in sparse areas produce no candidates.
**Prevention:** Progressive relaxation strategy with transparent fallback tiers.
**Phase:** Phase 3.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Conversation schema | False-precision plans from ambiguous input | Required slot confirmation + confidence-gated clarifications |
| Coordinate/data contract | Mixed coordinate systems causing drift | Canonical GCJ-02 pipeline + conversion metadata + tests |
| Routing integration | Unhandled nondeterminism and provider limits | Route versioning, drift tolerance, retry taxonomy, circuit breaker |
| POI recommendations | Stale/noisy lodging metadata | POI reliability scoring + uncertainty labeling + fallback candidates |
| Planning optimization | Distance-only “optimal” but rider-unfriendly plans | Multi-objective scoring + hard daily caps + explainable ordering |
| Roadbook rendering | Markdown not auditable or safe to mutate | Canonical JSON itinerary + deterministic markdown renderer |
| Operations | Quota/auth incidents degrade chat UX | Provider health monitoring, alerting, rate budgets, graceful fallback |
| Safety iteration | Unsafe segments persist across users | Incident feedback loop + avoid-list updates + manual override hooks |

## Sources

- AMap Web Service API — Path Planning (official): https://lbs.amap.com/api/webservice/guide/api/direction
- AMap Web Service API — Geocoding/Regeo (official): https://lbs.amap.com/api/webservice/guide/api/georegeo
- AMap Web Service API — Coordinate Conversion (official): https://lbs.amap.com/api/webservice/guide/api/convert
- AMap Web Service API — POI Search (official): https://lbs.amap.com/api/webservice/guide/api-advanced/search
- AMap Web Service API — Quota/Flow Limit (official): https://lbs.amap.com/api/webservice/guide/tools/flowlevel
- AMap Web Service API — Error Codes (official): https://lbs.amap.com/api/webservice/guide/tools/info
- AMap Terms (official legal/usage constraints): https://lbs.amap.com/home/terms/

## Confidence

- **Overall:** MEDIUM-HIGH
- **High confidence:** AMap technical constraints (routing variability, quotas, error handling, coordinate conversion requirements).
- **Medium confidence:** Cycling-specific optimization/safety heuristics (requires validation with pilot users and regional ride data).
