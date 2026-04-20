# roadbook-tool

## What This Is

roadbook-tool is a chat-first route planning skill for cyclists, focused on building practical multi-stop roadbooks in China. It takes start/end points, waypoints, time constraints, and desired riding intensity, then proposes an optimized sequence and day-by-day riding plan. It also surfaces high-quality lodging candidates near route points so cyclists can execute the trip with less manual planning.

## Core Value

Given rider constraints and trip intent, the tool reliably produces an actionable cycling roadbook that balances route feasibility and lodging quality.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can provide start, end, and optional waypoints in a chat flow
- [ ] User can define both trip duration and daily riding time windows
- [ ] User can select riding intensity using distance + duration constraints
- [ ] System can reorder waypoints to optimize route feasibility
- [ ] System can generate a Markdown roadbook for single-day and multi-day trips
- [ ] System can recommend nearby hostels, guesthouses, and hotels by score and price rules

### Out of Scope

- Global map-provider parity in v1 — v1 is China-first and AMap-based for delivery speed
- Full custom map-provider integration in v1 — deferred to v2 to avoid architecture sprawl early
- Web UI and standalone CLI in v1 — chat skill is the first delivery vehicle

## Context

- Inspiration source: Gathere repository, adapted into a cyclist-specific roadbook generator.
- Real scenario: connect to AMap and build route plans from conversational inputs.
- Inputs expected in conversation:
  - Start and destination
  - Waypoints
  - Riding intensity target
  - Time constraints (trip duration + daily riding windows)
- Lodging intent:
  - Highlight quality accommodations near route points for overnight planning
  - Accommodation types: hostel, guesthouse, hotel
  - Initial thresholds:
    - Hostel: rating >= 4.0, price 40-100 CNY
    - Guesthouse: rating >= 4.0, price <= 200 CNY
    - Hotel: rating >= 4.0, price <= 200 CNY
- Intensity baseline (default):
  - Easy: <= 50 km and <= 3.5 h per day
  - Standard: <= 80 km and <= 5 h per day
  - Challenge: <= 110 km and <= 7 h per day
- v1 map boundary:
  - China routes via AMap APIs
  - Future need captured: pluggable custom map providers (v2)

## Constraints

- **Map Provider**: AMap-first in v1 (China) — fastest path to reliable routing and POI coverage
- **Product Shape**: Chat skill only in v1 — reduces interface complexity during validation
- **Output Format**: Markdown roadbook — human-readable and easy to share
- **Accommodation Quality**: Enforce score/price filters — aligns with cyclist lodging expectations
- **Planning Logic**: Waypoints may be reordered — route optimization is required by product behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a chat skill first | Validate planning logic before UI expansion | — Pending |
| Support single-day and multi-day in v1 | Real cyclist trips require both use cases | — Pending |
| Model riding intensity with distance + duration | Better reflects physical load than one metric | — Pending |
| Use AMap for v1 and defer custom map integration | Lower implementation risk while preserving future extensibility | — Pending |
| Output roadbook as Markdown | Immediate usability and low integration overhead | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-20 after initialization*
