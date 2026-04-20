# Architecture Patterns: AMap-Backed Cycling Roadbook Chat Skill (v1)

**Domain:** Cycling route planning + lodging recommendation (China-first)  
**Researched:** 2026-04-20  
**Confidence:** MEDIUM-HIGH (AMap API behavior is verified; v2 provider strategy is inferred from proven architecture patterns)

## Recommended Architecture (v1 with v2 path)

Use a **Ports-and-Adapters (Hexagonal)** structure:

- Keep planning logic in provider-agnostic domain services.
- Put AMap in one adapter behind provider ports.
- Keep chat orchestration separate from planning computation.

This is the fastest v1 path and the cleanest v2 migration path.

## Component Boundaries

| Component | Responsibility | Talks To |
|---|---|---|
| Chat Channel Adapter | Receives user turns, returns markdown response, handles auth/session identity | Conversation Application Service |
| Conversation Application Service | Intent extraction, slot filling, clarification questions, command creation | Planning Orchestrator, Session Store |
| Planning Orchestrator | Executes planning workflow and step ordering | Constraint Engine, Route Planning Service, Lodging Service, Roadbook Renderer |
| Constraint Engine | Normalizes intensity/time constraints into concrete daily limits | Planning Orchestrator |
| Route Planning Service | Builds route candidates, waypoint reorder strategy, segment feasibility checks | Map Provider Port |
| Lodging Service | Queries nearby POIs and filters by rating/price thresholds | Map Provider Port |
| Roadbook Renderer | Converts final plan into Markdown output contract | Planning Orchestrator |
| **Map Provider Port (interface layer)** | Stable contracts for `geocode`, `routeBike`, `searchNearbyLodging` | AMap Adapter (v1), future adapters (v2) |
| AMap Adapter (v1) | Calls AMap APIs, maps AMap fields/errors to canonical domain model | AMap Web APIs |
| Session Store + Cache | Conversation state, intermediate plan snapshots, API response caching | Conversation Service, Orchestrator, AMap Adapter |
| Observability + Policy | Structured logs, metrics, rate-limit handling, retries, circuit breaking | All runtime components |

## Provider Contract (critical for v2)

Define canonical interfaces now and forbid raw AMap payloads outside adapter:

```ts
interface MapProvider {
  geocode(input: PlaceQuery): Promise<GeoPoint[]>;
  routeBike(input: BikeRouteRequest): Promise<BikeRouteResult>;
  searchNearbyLodging(input: NearbySearchRequest): Promise<LodgingPoi[]>;
}
```

Rules:

- Domain uses canonical units only (`meters`, `seconds`, `CNY`).
- Provider-specific fields stay in adapter-local metadata.
- Capability flags are explicit (`supportsWaypointOptimize`, `maxRouteDistanceKm`).

## Data Flow (direction explicit)

1. `User -> Chat Adapter -> Conversation Service`  
   Parse start/end/waypoints/intensity/time-window, ask clarifications if missing.
2. `Conversation Service -> Planning Orchestrator`  
   Send a validated `PlanTripCommand`.
3. `Planning Orchestrator -> Constraint Engine`  
   Convert intensity + schedule into per-day ride budget.
4. `Planning Orchestrator -> Route Planning Service -> Map Provider Port -> AMap Adapter -> AMap APIs`  
   Resolve coordinates and compute cycling route segments.
5. `Planning Orchestrator -> Lodging Service -> Map Provider Port -> AMap Adapter -> AMap APIs`  
   Search nearby lodging candidates for overnight checkpoints.
6. `Lodging Service -> Planning Orchestrator`  
   Apply score/price policy filters and rank candidates.
7. `Planning Orchestrator -> Roadbook Renderer`  
   Build day-by-day plan + lodging picks into Markdown.
8. `Roadbook Renderer -> Chat Adapter -> User`  
   Return final roadbook and optional adjustment prompts.

## Build Order (dependency-driven)

1. **Canonical domain model + provider ports**  
   Dependency base for everything else; prevents AMap schema leakage.
2. **AMap adapter (v1 only) + resilient API client**  
   Needed before route/lodging services can be tested end-to-end.
3. **Route planning service (single-day first)**  
   Establish feasible segment computation before multi-day logic.
4. **Constraint engine + multi-day splitter**  
   Turn route into day plans using intensity/time budgets.
5. **Lodging service + filtering policy**  
   Add overnight practicality after route feasibility exists.
6. **Markdown renderer + response schema tests**  
   Freeze user-visible output contract for chat skill.
7. **Conversation flow orchestration and clarification loop**  
   Integrate slot-filling and iterative refinement UX.
8. **Observability/rate-limit guardrails and cache tuning**  
   Required for stable production behavior under API quotas.
9. **v2 prep: provider registry + second adapter spike**  
   Add runtime provider selection once v1 behavior is validated.

## v1 Decisions That Keep v2 Open

- Introduce `MapProvider` interface in v1, even with only one implementation.
- Keep provider selection config-driven (`provider=amap` now, extensible later).
- Add canonical POI taxonomy mapping (`hostel/guesthouse/hotel`) at domain edge.
- Centralize error translation (`AMap infocode -> domain error class`) for portability.
- Build contract tests against `MapProvider`; run same tests for future providers.

## Major Risks and Mitigations

| Risk | Why It Matters | Mitigation |
|---|---|---|
| AMap quota/rate limits | Planning flow can fan out into many route/POI calls | Request budget per plan, caching, retry with backoff, circuit breaker |
| Provider schema coupling | Blocks v2 adapters and causes rewrite | Canonical DTOs + adapter-only mapping |
| Over-ambitious orchestration in v1 | Slows validation and increases failure modes | Ship deterministic planner first, keep conversation loop simple |
| Weak observability | Hard to tune quality and cost | Structured step logs + per-step latency + API quota metrics |

## Sources

- AMap API docs (riding route `/v4/direction/bicycling`, includes 500km note): https://amap.apifox.cn/api-14569242
- AMap API docs (POI around search `/v3/place/around`): https://amap.apifox.cn/api-14633656
- AMap API docs (quotas and QPS guidance): https://amap.apifox.cn/doc-541078
- AMap API docs (error codes for retry/guardrail policy): https://amap.apifox.cn/doc-541077
- Project requirements context: `/Users/franklin/Repo/private/roadbook-tool/.planning/PROJECT.md`
