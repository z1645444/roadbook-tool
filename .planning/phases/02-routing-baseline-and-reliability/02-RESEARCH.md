# Phase 2: Routing Baseline and Reliability - Research

**Researched:** 2026-04-21  
**Domain:** AMap geocoding and cycling-routing reliability for single-day planning  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No phase-specific `02-CONTEXT.md` exists in `.planning/phases/02-routing-baseline-and-reliability/`, so no discuss-phase locked decisions were available to copy verbatim. [VERIFIED: local repo file]
- Phase 2 scope is "reliable single-day AMap cycling routing with geocode ambiguity handling, reproducibility metadata, and clear fallback errors." [VERIFIED: local repo file]
- Phase 2 must satisfy `ROUT-01`, `ROUT-02`, `ROUT-05`, `RELY-01`, and `RELY-03`. [VERIFIED: local repo file]
- v1 remains AMap-first and chat-skill-only. [VERIFIED: local repo file]

### Claude's Discretion
- Internal module/file boundaries for routing and provider adapters are not locked yet. [VERIFIED: local repo file]
- Exact ambiguity threshold values and fallback message wording are not locked yet. [VERIFIED: local repo file]
- Exact reproducibility-hash payload schema is not locked yet. [VERIFIED: local repo file]

### Deferred Ideas (OUT OF SCOPE)
- Waypoint reorder optimization (`ROUT-03`) is Phase 3 scope, not Phase 2. [VERIFIED: local repo file]
- Multi-day stage split (`ROUT-04`) is Phase 3 scope, not Phase 2. [VERIFIED: local repo file]
- Lodging policies (`LODG-*`) and Markdown roadbook rendering (`BOOK-*`) are later phases. [VERIFIED: local repo file]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUT-01 | Geocode accepted points with AMap and reject ambiguous points unless user confirms. | AMap geocode endpoint contract + explicit disambiguation gate pattern + clarification/error taxonomy. [VERIFIED: local repo file] [CITED: https://lbs.amap.com/api/webservice/guide/api/georegeo] |
| ROUT-02 | Generate cycling route segments between ordered points using AMap bicycling APIs. | Use `/v4/direction/bicycling` per segment from ordered canonical points; persist distance/duration and response metadata. [CITED: https://amap.apifox.cn/api-14569242] [CITED: https://lbs.amap.com/api/webservice/guide/api/direction] |
| ROUT-05 | Keep single-day planning behavior when trip is configured as one day. | Add explicit one-day guard (`tripDays.normalized === 1`) that disables stage splitting and returns one route day artifact. [VERIFIED: local repo file] [ASSUMED] |
| RELY-01 | Handle AMap quota/auth/rate errors with clear user-facing fallback. | Map `infocode` classes (auth/quota/rate/busy/out-of-service) to deterministic user-safe error messages. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] |
| RELY-03 | Record route generation metadata (time/provider hash) for reproducibility diagnostics. | Persist generation timestamp + provider endpoint + normalized request fingerprint + response hash in canonical route artifact. [VERIFIED: local repo file] [VERIFIED: local node runtime] [ASSUMED] |
</phase_requirements>

## Summary

Phase 2 should be planned as a provider-adapter reliability slice, not as full planner intelligence. The minimum complete behavior is: geocode accepted points, block ambiguous points, generate ordered cycling segments, enforce one-day output when `tripDays=1`, and persist reproducibility metadata with classified fallback errors. [VERIFIED: local repo file]

AMap docs confirm the geocode endpoint (`/v3/geocode/geo`) and routing endpoint (`/v4/direction/bicycling`) as the core contracts, while official guidance also warns route results can differ over time and that quota/QPS limits apply. This makes deterministic metadata capture and explicit failure classification mandatory in this phase, not optional hardening. [CITED: https://lbs.amap.com/api/webservice/guide/api/georegeo] [CITED: https://amap.apifox.cn/api-14569242] [CITED: https://lbs.amap.com/api/webservice/guide/api/direction] [CITED: https://lbs.amap.com/api/webservice/guide/tools/flowlevel]

The existing codebase already has a canonical draft model, clarification policy primitives, and repository persistence. Phase 2 should extend those foundations with routing-specific services and tests, instead of replacing Phase 1 structures. [VERIFIED: local repo file]

**Primary recommendation:** Plan Phase 2 around a strict `MapProvider` adapter flow (`geocode -> disambiguate -> segment-route -> metadata-persist -> fallback-map`) with single-day guardrails as explicit control flow. [VERIFIED: local repo file] [ASSUMED]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Geocode accepted points and classify ambiguity | API / Backend | Database / Storage | Geocode integration and ambiguity policy are server orchestration concerns; outcomes must be persisted in canonical state. [VERIFIED: local repo file] [CITED: https://lbs.amap.com/api/webservice/guide/api/georegeo] |
| Generate bicycling segments across ordered points | API / Backend | Database / Storage | Segment routing calls external API and builds deterministic route artifact for later phases. [VERIFIED: local repo file] [CITED: https://amap.apifox.cn/api-14569242] |
| Enforce single-day behavior (`tripDays=1`) | API / Backend | — | Stage splitting belongs to later phase; one-day enforcement is a control-flow gate in backend planner orchestration. [VERIFIED: local repo file] |
| Provider error classification and fallback messages | API / Backend | Browser / Client | Error taxonomy is backend-owned; chat client only renders mapped user-facing text. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED] |
| Reproducibility metadata (timestamp/request hash/response hash) | Database / Storage | API / Backend | Backend computes and writes metadata; storage preserves audit trail for operators. [VERIFIED: local repo file] [VERIFIED: local node runtime] [ASSUMED] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | 11.1.19 | Exception + validation boundary primitives | Existing app is Nest-based and already uses global validation in bootstrap. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `@nestjs/core` | 11.1.19 | Application module/runtime lifecycle | Required Nest runtime foundation already in project deps. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `@nestjs/platform-fastify` | 11.1.19 | Fastify adapter in Nest app | Matches current bootstrap architecture. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `fastify` | 5.8.5 | HTTP server + error-handler hooks | Supports centralized error handling for mapped fallback responses. [VERIFIED: npm registry] [CITED: https://fastify.dev/docs/latest/Reference/Server/#seterrorhandler] |
| `class-validator` | 0.15.1 | DTO validation for inbound turn/routing requests | Enforces strict boundary checks before provider calls. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `class-transformer` | 0.5.1 | DTO transformation path for Nest validation | Standard companion for class-validator in Nest DTO flows. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `zod` | 4.3.6 | Schema validation for canonical route artifact and metadata payloads | Deterministic parse/safeParse path for persistence contracts. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `vitest` | 4.1.4 | Unit/integration tests for ROUT/RELY requirements | Already configured and active in repository. [VERIFIED: npm registry] [VERIFIED: local repo file] |
| `node:crypto` | built-in (Node v22.18.0 runtime present) | Stable request/response hashing for reproducibility metadata | Avoids hand-rolled hashing logic and external deps. [VERIFIED: local node runtime] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `luxon` | 3.7.2 | Timestamp normalization for metadata fields | Use for ISO timestamp validation/formatting if stricter date handling is needed beyond native `Date`. [VERIFIED: npm registry] [VERIFIED: local repo file] [ASSUMED] |
| `pino` | 10.3.1 | Structured logs for route attempts and infocode classes | Use when adding operational diagnostics for retries and fallback incidents. [VERIFIED: npm registry] [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node:crypto createHash` | custom JSON checksum helper | Custom checksum logic increases collision/consistency risk and adds avoidable maintenance. [VERIFIED: local node runtime] [ASSUMED] |
| Nest/DTO + zod hybrid | zod-only everywhere | zod-only is viable, but diverges from existing Nest DTO pipeline already used in codebase. [VERIFIED: local repo file] [ASSUMED] |
| Per-endpoint ad-hoc error strings | centralized infocode taxonomy mapper | Ad-hoc strings drift and become inconsistent; mapper keeps RELY-01 behavior deterministic. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED] |

**Installation:**
```bash
pnpm add @nestjs/common @nestjs/core @nestjs/platform-fastify fastify class-validator class-transformer zod luxon pino
pnpm add -D vitest
```

**Version verification (npm registry, checked 2026-04-21):**
- `@nestjs/common` `11.1.19` (published `2026-04-13T07:52:24.921Z`) [VERIFIED: npm registry]
- `@nestjs/core` `11.1.19` (published `2026-04-13T07:52:27.396Z`) [VERIFIED: npm registry]
- `@nestjs/platform-fastify` `11.1.19` (published `2026-04-13T07:52:24.512Z`) [VERIFIED: npm registry]
- `fastify` `5.8.5` (published `2026-04-14T12:07:12.232Z`) [VERIFIED: npm registry]
- `class-validator` `0.15.1` (published `2026-02-26T10:46:55.062Z`) [VERIFIED: npm registry]
- `class-transformer` `0.5.1` (published `2021-11-22T19:04:09.677Z`) [VERIFIED: npm registry]
- `zod` `4.3.6` (published `2026-01-22T19:14:35.382Z`) [VERIFIED: npm registry]
- `luxon` `3.7.2` (published `2025-09-05T10:14:55.814Z`) [VERIFIED: npm registry]
- `vitest` `4.1.4` (published `2026-04-09T07:36:52.741Z`) [VERIFIED: npm registry]
- `pino` `10.3.1` (published `2026-02-09T15:50:56.728Z`) [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Accepted Canonical Draft Points
   |
   v
Geocode Resolver (AMap /v3/geocode/geo)
   |
   +---- ambiguous or low-confidence ----> Clarification Gate (block + ask user)
   |                                               |
   |                                               v
   |                                        User confirmation
   |                                               |
   +-------------------------- confirmed ----------+
   |
   v
Ordered Point List (origin -> waypoints -> destination)
   |
   v
Segment Router (AMap /v4/direction/bicycling per leg)
   |
   +---- infocode/error ----> Error Classifier ----> User Fallback Message
   |
   v
Single-Day Guard (tripDays == 1 => one route day artifact)
   |
   v
Repro Metadata Builder (timestamp + request fingerprint + response hash)
   |
   v
Canonical Route Artifact Persisted
```

### Recommended Project Structure
```text
src/
├── routing/                    # routing orchestrator and segment planner
├── map-provider/               # provider port + AMap adapter + error mapper
├── reliability/                # fallback classification and metadata hashing
├── constraints/                # existing canonical draft model/repository
├── conversation/               # existing clarification + intake flow
└── shared/validation/          # DTO/zod schemas for route artifacts
tests/
├── routing/                    # ROUT-01/ROUT-02/ROUT-05 behavior tests
└── reliability/                # RELY-01/RELY-03 behavior tests
```

### Pattern 1: Geocode -> Clarify -> Confirm (Blocking Ambiguity)
**What:** Resolve each accepted point through geocoding, but block route generation if candidate ambiguity is detected or confidence falls below policy threshold. [VERIFIED: local repo file] [ASSUMED]  
**When to use:** For origin/destination/waypoint before segment routing. [VERIFIED: local repo file]  
**Example:**
```typescript
// Source: local clarification policy + ROUT-01 contract
const decision = evaluateClarificationNeed(slot, confidence, candidateCount);

if (decision.clarificationNeeded) {
  return {
    status: 'need_clarification',
    prompt: decision.prompt,
  };
}
```

### Pattern 2: Ordered Segment Routing via AMap Bicycling API
**What:** Route each consecutive pair in ordered points (`P0->P1`, `P1->P2`, ...), aggregate distances/durations, and preserve per-segment provider response context. [CITED: https://amap.apifox.cn/api-14569242] [ASSUMED]  
**When to use:** ROUT-02 in Phase 2 baseline (without waypoint reorder). [VERIFIED: local repo file]  
**Example:**
```typescript
// Source: AMap bicycling endpoint shape
for (let i = 0; i < points.length - 1; i += 1) {
  const origin = `${points[i].lng},${points[i].lat}`;
  const destination = `${points[i + 1].lng},${points[i + 1].lat}`;
  const route = await amap.routeBicycling({ origin, destination });
  segments.push(route);
}
```

### Pattern 3: Single-Day Guardrail + Deterministic Metadata
**What:** If `tripDays.normalized === 1`, force one-day route artifact and persist reproducibility metadata (`generatedAtIso`, provider endpoint, requestFingerprint, responseHash`). [VERIFIED: local repo file] [ASSUMED]  
**When to use:** Always for ROUT-05 + RELY-03 in this phase. [VERIFIED: local repo file]  
**Example:**
```typescript
// Source: Node runtime crypto availability + Phase 2 requirement
import { createHash } from 'node:crypto';

const requestFingerprint = createHash('sha256')
  .update(JSON.stringify(requestPayload))
  .digest('hex');
```

### Anti-Patterns to Avoid
- **First-candidate auto-accept for place names:** silently selecting one geocode result violates ROUT-01 disambiguation behavior. [VERIFIED: local repo file] [ASSUMED]
- **Stage-splitting in Phase 2 baseline:** multi-day decomposition belongs to Phase 3 and can break ROUT-05 one-day behavior. [VERIFIED: local repo file]
- **Direct provider errors leaking to user:** raw `infocode`/internal details are not user-safe fallback UX for RELY-01. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Reproducibility hash | Custom checksum function | `node:crypto` SHA-256 | Built-in, stable, well-tested primitive reduces collision/implementation risk. [VERIFIED: local node runtime] [ASSUMED] |
| Request boundary validation | Manual `if` trees for DTO fields | Existing Nest validation + zod schemas | Keeps validation deterministic and aligned with current codebase conventions. [VERIFIED: local repo file] |
| Provider error taxonomy | Scattered per-call string matching | Central `infocode -> domain error class` mapper | Ensures consistent fallback behavior across endpoints. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED] |
| Ambiguity workflow | Ad-hoc one-off clarifications | Existing clarification policy service extension | Reuses established confirmation gate behavior from Phase 1. [VERIFIED: local repo file] |

**Key insight:** Reliability failures in this phase are mostly classification and state-consistency failures, not algorithmic complexity failures, so centralized contracts matter more than "clever" route logic. [VERIFIED: local repo file] [ASSUMED]

## Common Pitfalls

### Pitfall 1: Treating Geocode Success as Unambiguous
**What goes wrong:** Route generation proceeds even when place resolution is ambiguous. [VERIFIED: local repo file]  
**Why it happens:** Teams conflate "API returned results" with "user intent confirmed." [ASSUMED]  
**How to avoid:** Require explicit confirmation for ambiguous/low-confidence point resolution before route calls. [VERIFIED: local repo file]  
**Warning signs:** High correction rate right after first route response. [ASSUMED]

### Pitfall 2: Missing Error-Class Mapping for AMap infocode
**What goes wrong:** Users get generic failures or internal codes without fallback guidance. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info]  
**Why it happens:** Error handling implemented per endpoint ad hoc. [ASSUMED]  
**How to avoid:** Define one mapper with retryable/non-retryable classes and user-safe fallback templates. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED]  
**Warning signs:** Inconsistent error texts for equivalent quota/auth/rate conditions. [ASSUMED]

### Pitfall 3: Non-Reproducible Route Results
**What goes wrong:** Same user inputs can produce different outputs over time with no diagnostic trail. [CITED: https://lbs.amap.com/api/webservice/guide/api/direction]  
**Why it happens:** Route API behavior can vary and metadata is not stored. [CITED: https://lbs.amap.com/api/webservice/guide/api/direction] [ASSUMED]  
**How to avoid:** Persist request fingerprint, provider endpoint, and response hash with timestamp for each generation. [VERIFIED: local node runtime] [ASSUMED]  
**Warning signs:** Support cannot explain drift between two route generations. [ASSUMED]

## Code Examples

Verified patterns from official sources and local runtime:

### AMap Geocode Call Contract
```typescript
// Source: https://lbs.amap.com/api/webservice/guide/api/georegeo
const url = new URL('https://restapi.amap.com/v3/geocode/geo');
url.searchParams.set('key', amapKey);
url.searchParams.set('address', rawAddress);
// Optional city disambiguation should be included when available.
```

### AMap Bicycling Route Contract
```typescript
// Source: https://amap.apifox.cn/api-14569242
const url = new URL('https://restapi.amap.com/v4/direction/bicycling');
url.searchParams.set('key', amapKey);
url.searchParams.set('origin', `${origin.lng},${origin.lat}`);
url.searchParams.set('destination', `${dest.lng},${dest.lat}`);
```

### Reproducibility Hashing (Node Built-In)
```typescript
// Source: local node runtime verification
import { createHash } from 'node:crypto';

const responseHash = createHash('sha256')
  .update(JSON.stringify(providerResponse))
  .digest('hex');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Route output treated as deterministic artifact without provenance | Store generation metadata and detect drift explicitly | Already recognized in current AMap docs and project reliability requirements | Improves operator diagnostics and incident triage. [CITED: https://lbs.amap.com/api/webservice/guide/api/direction] [VERIFIED: local repo file] |
| Generic "routing failed" messages | Error-class fallback mapped from provider `infocode` taxonomy | Current AMap error-code table usage | Better user trust and lower support ambiguity. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] |
| Implicit single-day fallback logic | Explicit guardrail for `tripDays=1` in planner control flow | Required by ROUT-05 | Prevents accidental multi-day staging regressions. [VERIFIED: local repo file] |

**Deprecated/outdated:**
- Treating ambiguous place names as acceptable for direct routing is outdated for this product contract because ROUT-01 explicitly requires rejection unless user confirms. [VERIFIED: local repo file]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Confidence threshold values can be reused/extended from current clarification policy for routing points. | Architecture Patterns | Wrong threshold increases false clarifications or false accepts. |
| A2 | Response hashing with SHA-256 is sufficient for reproducibility diagnostics (not cryptographic proof). | Pattern 3 / RELY-03 | If insufficient, future audits may need stronger canonicalization/signing. |
| A3 | A centralized error mapper can fully cover phase-relevant AMap failures without endpoint-specific overrides. | Don't Hand-Roll / Pitfall 2 | Missing edge cases may still leak generic errors. |
| A4 | Single-day behavior should return exactly one day artifact, even if route segments are many. | ROUT-05 support | Misinterpretation could conflict with later roadbook rendering assumptions. |
| A5 | Pino should be included in this phase for operational logs, even though not yet present in package deps. | Standard Stack Supporting | Adds dependency and implementation overhead if deferred by team. |

## Open Questions (RESOLVED)

1. **What exact ambiguity policy should trigger mandatory clarification for geocode results? — RESOLVED (2026-04-21)**
   - Decision: Use existing clarification thresholds and make the rule explicit for Phase 2.
   - Rule: `candidateCount > 1` => mandatory clarification; `candidateCount === 1 && confidence < 0.85` => mandatory clarification; `candidateCount === 1 && confidence >= 0.85` => accepted, with assumed-state messaging when `confidence < 0.95`.
   - Rationale: Aligns with existing `MIN_ACCEPT_CONFIDENCE = 0.85` behavior and ROUT-01 blocking requirement. [VERIFIED: local repo file]

2. **What exact metadata schema is mandatory for RELY-03? — RESOLVED (2026-04-21)**
   - Decision: Require both request and response hashing plus provider/time metadata in one canonical payload.
   - Required fields: `generatedAtIso`, `provider`, `endpoint`, `requestFingerprint`, `responseHash`, `infocode`.
   - Hashing contract: SHA-256 on canonical JSON string for both request payload and provider response payload.
   - Rationale: Satisfies RELY-03 reproducibility diagnostics with deterministic, auditable fields used by Plans 02-03/02-04. [VERIFIED: local repo file] [VERIFIED: local node runtime]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Nest/Fastify runtime + hashing | yes | v22.18.0 | — |
| pnpm | dependency/test commands | yes | 10.32.1 | npm scripts can run via npm |
| npm | version verification and package registry checks | yes | 10.9.3 | — |
| curl | AMap contract checks and connectivity probes | yes | 8.7.1 | Node fetch |
| Vitest | phase validation automation | yes | 4.1.4 | — |
| AMap Web Service Key env var | real integration calls | no (not found in current env probe) | — | mock adapter for unit tests only |
| Redis CLI | optional resilience/cache probing | no | — | skip Redis integration in this phase baseline |
| PostgreSQL readiness tools (`pg_isready`) | optional DB readiness probe | no | — | use current file-backed repository in baseline |

**Missing dependencies with no fallback:**
- A valid AMap key for real end-to-end integration runs is missing in current shell environment. [VERIFIED: local command output]

**Missing dependencies with fallback:**
- `redis-cli` and `pg_isready` are absent, but Phase 2 baseline can proceed with existing file-backed repository + mocked provider tests. [VERIFIED: local command output] [ASSUMED]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 [VERIFIED: local command output] |
| Config file | `vitest.config.ts` [VERIFIED: local repo file] |
| Quick run command | `pnpm vitest run tests/routing --reporter=dot` [ASSUMED] |
| Full suite command | `pnpm vitest run` [VERIFIED: local repo file] |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUT-01 | ambiguous geocode blocks route progression until confirmation | unit/integration | `pnpm vitest run tests/routing/geocode-ambiguity.test.ts -t "ROUT-01"` | no (Wave 0) |
| ROUT-02 | ordered points produce ordered bicycling segments | integration | `pnpm vitest run tests/routing/segment-routing.test.ts -t "ROUT-02"` | no (Wave 0) |
| ROUT-05 | one-day trip yields single-day route artifact | unit | `pnpm vitest run tests/routing/single-day-enforcement.test.ts -t "ROUT-05"` | no (Wave 0) |
| RELY-01 | infocode classes map to clear fallback errors | unit | `pnpm vitest run tests/reliability/amap-error-mapping.test.ts -t "RELY-01"` | no (Wave 0) |
| RELY-03 | metadata includes timestamp + provider + request/response hashes | unit/integration | `pnpm vitest run tests/reliability/repro-metadata.test.ts -t "RELY-03"` | no (Wave 0) |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/routing tests/reliability --reporter=dot` [ASSUMED]
- **Per wave merge:** `pnpm vitest run` [VERIFIED: local repo file]
- **Phase gate:** Full suite green before `/gsd-verify-work` [VERIFIED: local repo file]

### Wave 0 Gaps
- [ ] `tests/routing/geocode-ambiguity.test.ts` - covers ROUT-01
- [ ] `tests/routing/segment-routing.test.ts` - covers ROUT-02
- [ ] `tests/routing/single-day-enforcement.test.ts` - covers ROUT-05
- [ ] `tests/reliability/amap-error-mapping.test.ts` - covers RELY-01
- [ ] `tests/reliability/repro-metadata.test.ts` - covers RELY-03

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (phase scope does not introduce auth flows) | Existing session-id scoped repository behavior only. [VERIFIED: local repo file] |
| V3 Session Management | yes | Keep route artifacts bound to `sessionId`; reject cross-session access paths. [VERIFIED: local repo file] [ASSUMED] |
| V4 Access Control | yes | Service-layer guardrails on session-scoped reads/writes. [VERIFIED: local repo file] [ASSUMED] |
| V5 Input Validation | yes | DTO + schema validation before provider calls. [VERIFIED: local repo file] |
| V6 Cryptography | yes | `node:crypto` for reproducibility fingerprints/hashes; never custom crypto code. [VERIFIED: local node runtime] |

### Known Threat Patterns for Nest + AMap adapter stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unvalidated point inputs passed to external API | Tampering | Validate DTO/schema and normalize coordinate format before request dispatch. [VERIFIED: local repo file] [ASSUMED] |
| AMap key leakage in logs/errors | Information Disclosure | Keep key in env var only and redact secrets from logs and fallback messages. [VERIFIED: local command output] [ASSUMED] |
| Quota/rate exhaustion causing route outage | Denial of Service | Classify infocode + bounded retry/backoff + user fallback path. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED] |
| Cross-session route artifact overwrite | Elevation of Privilege | Session-scoped repository methods and test coverage for isolation. [VERIFIED: local repo file] [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- Local repository artifacts and source code:
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
  - `AGENTS.md`
  - `src/constraints/constraint-draft.model.ts`
  - `src/constraints/constraint-draft.repository.ts`
  - `src/conversation/clarification-policy.service.ts`
  - `src/conversation/slot-resolver.service.ts`
  - `src/main.ts`
  - `tests/**`
  [VERIFIED: local repo files]
- AMap Web Service docs:
  - Geocode/Regeo guide: https://lbs.amap.com/api/webservice/guide/api/georegeo
  - Direction guide (nondeterminism note + response fields): https://lbs.amap.com/api/webservice/guide/api/direction
  - Error code table (`infocode`): https://lbs.amap.com/api/webservice/guide/tools/info
  - Flow/QPS guidance: https://lbs.amap.com/api/webservice/guide/tools/flowlevel
  [CITED: official docs]
- AMap Apifox endpoint doc:
  - Bicycling route endpoint and example request: https://amap.apifox.cn/api-14569242
  [CITED: official AMap Apifox docs]
- npm registry verification via `npm view`:
  - `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-fastify`, `fastify`, `class-validator`, `class-transformer`, `zod`, `luxon`, `vitest`, `pino`
  [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- Fastify `setErrorHandler` reference: https://fastify.dev/docs/latest/Reference/Server/#seterrorhandler

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all package versions were checked live via npm registry on 2026-04-21. [VERIFIED: npm registry]
- Architecture: MEDIUM - architecture is strongly grounded in local code and requirements, but some adapter-boundary details are still assumptions pending plan lock. [VERIFIED: local repo file] [ASSUMED]
- Pitfalls: MEDIUM - error/rate-limit classes are doc-backed, but threshold and UX policy tuning are still assumptions. [CITED: https://lbs.amap.com/api/webservice/guide/tools/info] [ASSUMED]

**Research date:** 2026-04-21  
**Valid until:** 2026-04-28 (7 days; API/error/quota behavior is fast-moving)
