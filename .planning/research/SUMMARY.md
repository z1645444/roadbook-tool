# Research Summary: roadbook-tool

**Date:** 2026-04-20
**Scope:** AMap-backed chat-first cyclist roadbook planner (China v1)

## Stack

- Backend baseline: `Node.js 24 + TypeScript + NestJS/Fastify`
- Data: `PostgreSQL + PostGIS` for itinerary and geospatial queries
- Optimization: `OR-Tools` for waypoint reorder and day-split constraints
- Integrations: AMap route/geocode/nearby POI APIs via adapter boundary
- Orchestration: tool-capable chat flow with deterministic planner core

## Table Stakes

- Conversational intake for start/end/waypoints/intensity/time constraints
- Route generation with waypoint handling and multi-day splitting
- Segment-level feasibility metrics and turn cues in roadbook output
- Lodging shortlist near overnight points with quality filters
- Exportable/readable output and iterative plan editing

## Watch Out For

- Coordinate normalization drift (GCJ-02 handling must be explicit)
- Ambiguous chat inputs causing false-precision plans
- Route nondeterminism and API quota/failure paths
- POI quality inconsistency (rating/price confidence handling)
- Markdown-only output without canonical machine-readable schema

## Architectural Direction

- Use ports-and-adapters from v1: core planner is map-provider agnostic
- Encapsulate AMap behind `MapProvider` (`geocode`, `routeBike`, `searchNearbyLodging`)
- Keep conversation orchestration separate from planning computation
- Build order: contracts -> provider adapter -> planner/lodging/renderer -> conversation integration

## Recommendation for Requirements

- Include all v1 table stakes above
- Keep custom map provider integration in v2 (interface reserved in v1)
- Define strict lodging policy fields and fallback strategy for sparse areas

---
*Last updated: 2026-04-20 after research synthesis*
