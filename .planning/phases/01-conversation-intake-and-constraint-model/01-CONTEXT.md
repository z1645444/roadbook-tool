# Phase 1: Conversation Intake and Constraint Model - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Capture cyclist planning constraints in chat, normalize them into a canonical itinerary draft,
and require explicit confirmation before any route generation starts.

This phase covers intake, normalization, ambiguity handling, and revision consistency only.
It does not include actual route generation, optimization, lodging search, or markdown roadbook
rendering.

</domain>

<decisions>
## Implementation Decisions

### Intake Flow and Confirmation
- **D-01:** Use a slot-driven conversation flow to capture origin, destination, waypoints, date
  range, total trip days, daily ride window, and intensity before planning.
- **D-02:** Require an explicit structured recap confirmation before route generation. Planning
  cannot proceed until the user confirms or corrects the recap.
- **D-03:** Ask only for missing or uncertain slots each turn; avoid re-asking already accepted
  fields.

### Canonical Constraint Model
- **D-04:** Keep a canonical machine-readable itinerary draft as the single source of truth.
  Human-readable recaps are derived from this model.
- **D-05:** Persist both raw user inputs and normalized values so later phases can trace how each
  accepted constraint was derived.
- **D-06:** Normalize units and formats at write time (km, hours, 24h local time, CNY) and store
  normalized constraint values in the canonical draft.

### Ambiguity and Validation Policy
- **D-07:** Treat ambiguous location resolution as blocking. The system must request user
  disambiguation before accepting a point.
- **D-08:** Use confidence-gated clarification prompts for low-confidence inputs instead of
  silently assuming values.
- **D-09:** When inference is unavoidable, surface the assumption explicitly in recap and provide
  a one-turn correction path.

### Revision Semantics
- **D-10:** Support field-level patch updates. Editing one field must not clear unrelated accepted
  constraints.
- **D-11:** Regenerate a full consistency recap after each accepted revision.
- **D-12:** Record revision metadata in the canonical draft (updated field, source turn, timestamp)
  to support reproducibility diagnostics in later phases.

### the agent's Discretion
- Exact confidence threshold values and scoring mechanics.
- Internal DTO names, module boundaries, and persistence layout.
- Prompt wording style, as long as semantics above remain intact.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and Requirement Contracts
- `.planning/ROADMAP.md` — Phase 1 goal, dependency boundary, and success criteria.
- `.planning/REQUIREMENTS.md` — `CONV-01` to `CONV-05` and `RELY-02` requirement contracts.
- `.planning/PROJECT.md` — v1 product constraints and intensity baseline assumptions.

### Architecture and Reliability Guardrails
- `.planning/research/ARCHITECTURE.md` — ports/adapters boundary and conversation-orchestrator
  separation.
- `.planning/research/PITFALLS.md` — ambiguity, coordinate drift, and canonical-model pitfalls
  that directly constrain intake design.
- `.planning/research/SUMMARY.md` — build-order guidance and deterministic planner-core direction.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/REQUIREMENTS.md` requirement IDs provide the acceptance contract for slot coverage.
- `.planning/PROJECT.md` contains explicit intensity baselines and hard v1 boundaries.
- `.planning/research/PITFALLS.md` provides concrete risk checks to encode into validation paths.

### Established Patterns
- The repository is currently planning-artifact-first, with no runtime source code yet.
- Deterministic behavior is a stated project goal via canonical machine-readable itinerary state.
- Provider abstraction is already defined as an architectural guardrail for downstream phases.

### Integration Points
- Phase 1 canonical itinerary draft feeds Phase 2 routing/geocode integration.
- Intake confirmation and assumption metadata feed Phase 5 roadbook assumption sections.
- Revision/change metadata created here supports reproducibility requirements in Phase 2.

</code_context>

<specifics>
## Specific Ideas

- Intake must capture: start, destination, optional waypoints, date range, total days, daily ride
  window, and intensity profile.
- Intensity remains profile-based (`easy`, `standard`, `challenge`) and maps to daily distance and
  duration caps from `.planning/PROJECT.md`.
- v1 remains chat-first and AMap-first; intake design should not introduce UI-only flows or
  provider-specific leakage into domain models.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 01-conversation-intake-and-constraint-model*
*Context gathered: 2026-04-20*
