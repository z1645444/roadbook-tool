# Technology Stack (2026): AMap-Backed Cycling Roadbook Chat Skill

**Project:** roadbook-tool  
**Scope:** chat skill for route planning + waypoint optimization + lodging recommendations  
**Version verification date:** 2026-04-20

## Recommended Stack (Prescriptive)

| Layer | Technology | Version | Why this choice | Confidence |
|---|---|---:|---|---|
| Runtime | Node.js LTS | 24.15.0 | Current LTS line (`Krypton`), stable for production backend services. | HIGH |
| Language | TypeScript | 6.0.3 | Best ecosystem support for Nest/Fastify, strict typing for planning logic. | HIGH |
| API framework | NestJS + Fastify adapter | 11.1.19 | Mature DI/module structure with Fastify performance for chat API latency. | HIGH |
| HTTP server | Fastify | 5.8.5 | Lower overhead than Express, strong JSON-schema validation path. | HIGH |
| Map provider integration | AMap Web Service APIs | v3/v4 endpoints | Official China-first routing/POI stack. Use `/v4/direction/bicycling`, `/v3/geocode/geo`, `/v3/place/around`. | HIGH |
| Primary DB | PostgreSQL | 18.3 | Reliable relational core for itinerary constraints, plans, auditability. | HIGH |
| Geospatial DB | PostGIS | 3.6.3 | Native spatial indexing/functions for route geometry and lodging proximity queries. | MEDIUM-HIGH |
| Cache + queue | Redis + BullMQ + ioredis | 8.6.2 / 5.75.2 / 5.10.1 | Queue long-running optimization jobs; cache AMap responses and plan expansions. | HIGH |
| Optimization solver | Google OR-Tools | 9.15 | Production-grade VRP/TSP constraints for waypoint reorder + day-split optimization. | HIGH |
| Data access | drizzle-orm + pg | 0.45.2 / 8.20.0 | SQL-first control (important for PostGIS and custom scoring formulas). | HIGH |
| AI/chat | OpenAI Responses API + openai SDK | API + 6.34.0 | Tool-capable chat orchestration in one API shape; clean Node SDK support. | HIGH |
| Geo utility helpers | @turf/turf | 7.3.5 | Lightweight geometry ops in app layer when DB roundtrip is unnecessary. | HIGH |
| Observability | pino + OpenTelemetry SDK | 10.3.1 / 0.215.0 | Structured logs + traces for route/solver latency and external API reliability. | HIGH |
| Test stack | Vitest | 4.1.4 | Fast TypeScript-native test runner for planner logic and API behavior tests. | HIGH |

## AMap API Contract for v1

1. Geocoding: `GET https://restapi.amap.com/v3/geocode/geo`
2. Cycling route: `GET https://restapi.amap.com/v4/direction/bicycling`
3. Lodging candidate search: `GET https://restapi.amap.com/v3/place/around`

Implementation notes:
- Use `types` + distance sorting (`sortrule=distance`) for lodging retrieval.
- Respect AMap paging and radius limits when collecting candidates.
- Enforce your product score/price filters in application logic after retrieval.

## What NOT To Use (and Why)

| Do not use | Why not |
|---|---|
| Nest + Express adapter as default | Slower request path than Fastify with no v1 product upside. |
| MongoDB as primary database | Worse fit for constraint-heavy itinerary logic and spatial SQL workflows than Postgres + PostGIS. |
| Prisma as primary data layer for v1 | Friction for advanced PostGIS-native queries; Drizzle + SQL gives tighter control. |
| Hand-rolled waypoint optimizer first | High risk of poor route quality; OR-Tools is battle-tested for VRP/TSP constraints. |
| AMap JS SDK on server side | Backend should call AMap Web Service APIs directly. |
| Legacy OpenAI Chat Completions-first design | Responses API is the forward path for tool-enabled agent behavior. |

## Install Baseline

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/platform-fastify fastify \
  zod drizzle-orm pg ioredis bullmq @turf/turf openai pino \
  @opentelemetry/sdk-node

pnpm add -D typescript vitest
```

## Sources

- Node releases: https://nodejs.org/dist/index.json
- TypeScript package: https://www.npmjs.com/package/typescript
- NestJS releases: https://github.com/nestjs/nest/releases
- Fastify releases: https://github.com/fastify/fastify/releases
- PostgreSQL release/docs: https://www.postgresql.org/docs/
- PostGIS docs/release notes: https://postgis.net/docs/
- Redis releases: https://github.com/redis/redis/releases
- OR-Tools releases: https://github.com/google/or-tools/releases
- AMap direction docs: https://lbs.amap.com/api/webservice/guide/api/direction
- AMap POI search docs: https://lbs.amap.com/api/webservice/guide/api-advanced/search
- AMap geocode docs: https://lbs.amap.com/api/webservice/guide/api/georegeo
- OpenAI Node SDK: https://github.com/openai/openai-node
- NPM version checks:
  - https://www.npmjs.com/package/@nestjs/core
  - https://www.npmjs.com/package/fastify
  - https://www.npmjs.com/package/bullmq
  - https://www.npmjs.com/package/ioredis
  - https://www.npmjs.com/package/drizzle-orm
  - https://www.npmjs.com/package/pg
  - https://www.npmjs.com/package/@turf/turf
  - https://www.npmjs.com/package/openai
  - https://www.npmjs.com/package/pino
  - https://www.npmjs.com/package/@opentelemetry/sdk-node
  - https://www.npmjs.com/package/vitest
