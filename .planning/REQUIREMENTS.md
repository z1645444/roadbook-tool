# Requirements: roadbook-tool

**Defined:** 2026-04-20
**Core Value:** Given rider constraints and trip intent, the tool reliably produces an actionable cycling roadbook that balances route feasibility and lodging quality.

## v1 Requirements

### Conversation and Inputs

- [x] **CONV-01
**: User can provide origin and destination through chat and get structured confirmation before planning.
- [x] **CONV-02
**: User can provide one or more waypoints and system can parse them into normalized route points.
- [x] **CONV-03
**: User can provide trip date range and total trip days for planning.
- [x] **CONV-04
**: User can provide daily ride time window (for example, 08:00-17:00) and system applies it as hard constraint.
- [x] **CONV-05
**: User can choose intensity profile (easy/standard/challenge) and system maps it to distance+duration caps.

### Routing and Optimization

- [ ] **ROUT-01**: System can geocode all accepted points with AMap and reject ambiguous points unless user confirms.
- [ ] **ROUT-02**: System can generate cycling route segments between ordered points using AMap bicycling APIs.
- [ ] **ROUT-03**: System can reorder waypoints to optimize route feasibility under constraints.
- [ ] **ROUT-04**: System can split route into day stages for multi-day trips using daily intensity and time-window limits.
- [ ] **ROUT-05**: System can keep single-day planning behavior when trip is configured as one day.

### Lodging Recommendations

- [ ] **LODG-01**: System can search lodging candidates near nightly stop points via AMap POI APIs.
- [ ] **LODG-02**: Hostel recommendations satisfy rating >= 4.0 and price range 40-100 CNY.
- [ ] **LODG-03**: Guesthouse recommendations satisfy rating >= 4.0 and price <= 200 CNY.
- [ ] **LODG-04**: Hotel recommendations satisfy rating >= 4.0 and price <= 200 CNY.
- [ ] **LODG-05**: System presents fallback strategy when strict filters return no results.

### Roadbook Output

- [ ] **BOOK-01**: System outputs final plan as Markdown roadbook grouped by day.
- [ ] **BOOK-02**: Each day includes route overview, distance, estimated ride time, and waypoint sequence.
- [ ] **BOOK-03**: Each day includes lodging shortlist near planned overnight points with score/price details.
- [ ] **BOOK-04**: Output includes assumptions and constraint summary so users can validate plan correctness.

### Reliability and Safety Baseline

- [ ] **RELY-01**: System handles AMap quota/auth/rate errors with clear user-facing fallback message.
- [x] **RELY-02
**: System keeps canonical machine-readable itinerary model internally and renders Markdown from it.
- [ ] **RELY-03**: System records route generation metadata (time/provider hash) for reproducibility diagnostics.

## v2 Requirements

### Map Provider Extensibility

- **MAPX-01**: System supports provider plugin registry and runtime selection beyond AMap.
- **MAPX-02**: System supports custom map provider adapter implementation against canonical provider interface.

### Advanced Planning Intelligence

- **PLAN-01**: System uses multi-objective optimization including elevation and load smoothness.
- **PLAN-02**: System supports rider profile personalization for pace and daily effort predictions.
- **PLAN-03**: System supports weather/wind-aware replanning.

### Ecosystem Integrations

- **INTG-01**: System exports GPX/TCX artifacts compatible with bike computers.
- **INTG-02**: System supports one-click sync to major cycling devices/platforms.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web application UI in v1 | Initial validation focuses on chat skill behavior and planning quality |
| Full global map-provider support in v1 | Increases integration complexity before core planner is validated |
| In-app booking/payment for lodging | Changes product scope from planning to OTA workflow |
| Social feed/challenges/community features | Not required to validate roadbook planning core value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONV-01 | Phase 1 | Complete |
| CONV-02 | Phase 1 | Complete |
| CONV-03 | Phase 1 | Complete |
| CONV-04 | Phase 1 | Complete |
| CONV-05 | Phase 1 | Complete |
| ROUT-01 | Phase 2 | Pending |
| ROUT-02 | Phase 2 | Pending |
| ROUT-03 | Phase 3 | Pending |
| ROUT-04 | Phase 3 | Pending |
| ROUT-05 | Phase 2 | Pending |
| LODG-01 | Phase 4 | Pending |
| LODG-02 | Phase 4 | Pending |
| LODG-03 | Phase 4 | Pending |
| LODG-04 | Phase 4 | Pending |
| LODG-05 | Phase 4 | Pending |
| BOOK-01 | Phase 5 | Pending |
| BOOK-02 | Phase 5 | Pending |
| BOOK-03 | Phase 5 | Pending |
| BOOK-04 | Phase 5 | Pending |
| RELY-01 | Phase 2 | Pending |
| RELY-02 | Phase 1 | Complete |
| RELY-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*
