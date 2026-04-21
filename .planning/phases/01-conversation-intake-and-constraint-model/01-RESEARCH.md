# Phase 1: Conversation Intake and Constraint Model - Research

**Researched:** 2026-04-20  
**Domain:** Chat intake orchestration, canonical constraint modeling, and deterministic recap confirmation  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
Verbatim copy from `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md` [VERIFIED: local repo file]

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

### Deferred Ideas (OUT OF SCOPE)
Verbatim copy from `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md` [VERIFIED: local repo file]

None - discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONV-01 | User can provide origin and destination through chat and get structured confirmation before planning. | Slot-first intake state + explicit confirmation gate pattern and DTO validation policy [VERIFIED: local repo files] [CITED: https://docs.nestjs.com/techniques/validation] |
| CONV-02 | User can provide one or more waypoints and system can parse them into normalized route points. | Canonical point schema storing `raw_input` and normalized route-point array with ambiguity status [VERIFIED: local repo files] [ASSUMED] |
| CONV-03 | User can provide trip date range and total trip days for planning. | Date/time parsing via Luxon validity checks and normalized local-time fields [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md] |
| CONV-04 | User can provide daily ride time window and system applies it as hard constraint. | Time-window DTO with strict format validation plus normalization to 24h and derived duration minutes [CITED: https://github.com/typestack/class-validator/blob/develop/README.md] [ASSUMED] |
| CONV-05 | User can choose intensity profile and system maps it to distance+duration caps. | Enumerated intensity profile with deterministic cap lookup in canonical draft [VERIFIED: local repo files] [ASSUMED] |
| RELY-02 | System keeps canonical machine-readable itinerary model internally and renders Markdown from it. | Canonical JSON draft as source-of-truth + recap renderer as pure projection; no markdown as primary state [VERIFIED: local repo files] [ASSUMED] |
</phase_requirements>

## Summary

Phase 1 should be planned as a deterministic intake engine with strict validation boundaries, not as a free-form chat flow. The planning-safe baseline is: slot-driven capture, canonical draft persistence, explicit recap confirmation gate, and field-level patch revisions that never clear unrelated accepted constraints [VERIFIED: local repo files].

The framework primitives for this are stable and current: Nest global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) for request contract enforcement, plus a schema layer for safe parse/normalization of model outputs or parser outputs before writing canonical state [CITED: https://docs.nestjs.com/techniques/validation] [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/basics.mdx].

Given the repository is planning-artifact-only right now, the highest leverage in planning is to define stable contracts first: canonical constraint schema, patch semantics, ambiguity status model, recap projection model, and requirement-to-test mapping. This reduces rewrite risk when Phase 2 adds AMap geocoding/routing [VERIFIED: local repo files].

**Primary recommendation:** Plan Phase 1 around a canonical `ConstraintDraft` aggregate with strict input validation and recap-confirmation gating before any downstream route work [VERIFIED: local repo files] [CITED: https://docs.nestjs.com/techniques/validation].

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Capture chat inputs (origin/destination/waypoints/dates/window/intensity) | API / Backend | Browser / Client | Chat skill v1 is backend-centric and current repo scope has no UI tier implementation [VERIFIED: local repo files]. |
| Normalize units/time/date/intensity into canonical fields | API / Backend | Database / Storage | Deterministic normalization logic belongs in service layer before persistence [ASSUMED]. |
| Canonical draft persistence (raw + normalized + revision metadata) | Database / Storage | API / Backend | Storage owns source-of-truth durability, API owns write rules [ASSUMED]. |
| Ambiguity tracking and clarification prompting | API / Backend | Browser / Client | Confidence gating and clarification decisions are orchestration logic in conversation backend [VERIFIED: local repo files]. |
| Recap rendering for explicit confirmation | API / Backend | Browser / Client | Recap is a projection from canonical draft and should be deterministic server-side [ASSUMED]. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | 11.1.19 | Global validation pipe and DTO runtime behavior | Official validation pipeline supports whitelist/transform safety model [VERIFIED: npm registry] [CITED: https://docs.nestjs.com/techniques/validation] |
| `@nestjs/core` | 11.1.19 | Nest app bootstrap and module orchestration | Required runtime core for Nest service boundaries [VERIFIED: npm registry] |
| `@nestjs/platform-fastify` | 11.1.19 | Fastify adapter for Nest | Matches project’s Fastify-first architecture guidance [VERIFIED: npm registry] [VERIFIED: local repo files] |
| `fastify` | 5.8.5 | HTTP server with schema-driven validation/serialization | Fastify’s JSON-schema path is well-documented and performant [VERIFIED: npm registry] [CITED: https://github.com/fastify/fastify/blob/main/docs/Reference/Validation-and-Serialization.md] |
| `class-validator` | 0.15.1 | DTO decorators for request contract checks | Directly integrates with Nest `ValidationPipe` workflows [VERIFIED: npm registry] [CITED: https://github.com/typestack/class-validator/blob/develop/README.md] |
| `class-transformer` | 0.5.1 | DTO transformation support | Used by Nest validation/transform path [VERIFIED: npm registry] [CITED: https://docs.nestjs.com/techniques/validation] |
| `zod` | 4.3.6 | Canonical draft schema parse + safe normalization | `safeParse` supports deterministic failure paths without throws [VERIFIED: npm registry] [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/basics.mdx] |
| `luxon` | 3.7.2 | Date/time window parsing and validity checks | Reliable ISO parsing and invalid-reason semantics [VERIFIED: npm registry] [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `openai` | 6.34.0 | Responses/chat orchestration client for structured extraction | Use when LLM-assisted slot extraction is needed behind canonical validation [VERIFIED: npm registry] [CITED: https://github.com/openai/openai-node/blob/master/README.md] |
| `vitest` | 4.1.4 | Unit/integration test framework for intake logic | Use from Wave 0 to lock requirement contracts early [VERIFIED: npm registry] |
| `pino` | 10.3.1 | Structured logs for ambiguity and revision traces | Use for auditability of intake decisions and corrections [VERIFIED: npm registry] [ASSUMED] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `class-validator` + DTO decorators | Zod-only request boundary | Zod-only can simplify schema reuse, but diverges from standard Nest validation path chosen in project research [VERIFIED: local repo files] [ASSUMED] |
| Luxon | native `Date` + regex parsing | Native date parsing is error-prone for localized time windows and invalid-reason diagnostics [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md] [ASSUMED] |
| OpenAI structured extraction | Rule-based parser only | Rule-only parser is lower cost but brittle on conversational phrasing variance [ASSUMED] |

**Installation:**
```bash
pnpm add @nestjs/common @nestjs/core @nestjs/platform-fastify fastify class-validator class-transformer zod luxon openai pino
pnpm add -D vitest
```

**Version verification:** [VERIFIED: npm registry]
- `@nestjs/common` `11.1.19` (published 2026-04-13T07:52:24.921Z)
- `@nestjs/core` `11.1.19` (published 2026-04-13T07:52:27.396Z)
- `@nestjs/platform-fastify` `11.1.19` (published 2026-04-13T07:52:24.512Z)
- `fastify` `5.8.5` (published 2026-04-14T12:07:12.232Z)
- `class-validator` `0.15.1` (published 2026-02-26T10:46:55.062Z)
- `class-transformer` `0.5.1` (published 2021-11-22T19:04:09.677Z)
- `zod` `4.3.6` (published 2026-01-22T19:14:35.382Z)
- `openai` `6.34.0` (published 2026-04-08T21:26:58.901Z)
- `luxon` `3.7.2` (published 2025-09-05T10:14:55.814Z)
- `vitest` `4.1.4` (published 2026-04-09T07:36:52.741Z)
- `pino` `10.3.1` (published 2026-02-09T15:50:56.728Z)

## Architecture Patterns

### System Architecture Diagram

```text
User Chat Input
   |
   v
Conversation Intake Controller
   |
   v
Slot Resolver -----> Missing/Low-Confidence? ----yes----> Clarification Prompt
   |                                                 ^             |
   no                                                |             v
   v                                                 +------ User Correction
Normalization Pipeline (date/time/intensity/units)
   |
   v
ConstraintDraft Aggregate (raw + normalized + metadata)
   |
   +---- Patch Update Command ----> Merge + Revision Audit
   |
   v
Recap Projection Builder
   |
   v
Explicit Confirmation Gate ----confirmed----> ReadyForPhase2 Event
                          \
                           \----not confirmed----> Continue Intake Loop
```

### Recommended Project Structure
```text
src/
├── conversation/            # intake controllers, prompts, slot orchestration
├── constraints/             # canonical draft model, normalization, merge logic
├── recap/                   # deterministic recap projection and confirmation gate
├── shared/validation/       # DTOs, zod schemas, parse error mapping
├── shared/time/             # time/date parsing helpers (Luxon wrappers)
└── tests/                   # unit + integration tests mapped to CONV/RELY IDs
```

### Pattern 1: Canonical Draft As Single Source of Truth
**What:** Persist one `ConstraintDraft` object containing accepted constraints, raw source values, and derived normalized values [VERIFIED: local repo files].  
**When to use:** On every accepted user turn and every patch update [VERIFIED: local repo files].  
**Example:**
```typescript
// Source: project decision D-04/D-05/D-06 in 01-CONTEXT.md
type ConstraintDraft = {
  id: string;
  slots: {
    origin?: { raw: string; normalized?: CanonicalPoint; status: 'missing' | 'accepted' | 'ambiguous' };
    destination?: { raw: string; normalized?: CanonicalPoint; status: 'missing' | 'accepted' | 'ambiguous' };
    waypoints: Array<{ raw: string; normalized?: CanonicalPoint; status: 'accepted' | 'ambiguous' }>;
    dateRange?: { raw: string; normalized?: { startDate: string; endDate: string } };
    tripDays?: { raw: string; normalized?: number };
    rideWindow?: { raw: string; normalized?: { start: string; end: string; minutes: number } };
    intensity?: { raw: string; normalized?: 'easy' | 'standard' | 'challenge' };
  };
  revisionLog: Array<{ field: string; turnId: string; timestampIso: string }>;
};
```

### Pattern 2: Validation-at-Boundary, Normalization-at-Write
**What:** Enforce DTO/schema validation at API boundary, then normalize only when writing accepted fields to draft [CITED: https://docs.nestjs.com/techniques/validation] [VERIFIED: local repo files].  
**When to use:** Every inbound turn and every inferred field [VERIFIED: local repo files].  
**Example:**
```typescript
// Source: https://docs.nestjs.com/techniques/validation
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Pattern 3: Field-Level Patch Merge with Deterministic Recap Regeneration
**What:** Apply partial updates only to changed fields and always regenerate full recap from canonical draft [VERIFIED: local repo files].  
**When to use:** Any user correction after initial intake [VERIFIED: local repo files].  
**Example:**
```typescript
function applyPatch(draft: ConstraintDraft, patch: Partial<ConstraintDraft['slots']>, turnId: string): ConstraintDraft {
  const next = { ...draft, slots: { ...draft.slots, ...patch } };
  const changedKeys = Object.keys(patch);
  next.revisionLog = [
    ...draft.revisionLog,
    ...changedKeys.map((field) => ({ field, turnId, timestampIso: new Date().toISOString() })),
  ];
  return next;
}
```

### Anti-Patterns to Avoid
- **Free-form recap state:** Storing recap text as primary state causes drift; keep recap as projection from canonical draft [VERIFIED: local repo files] [ASSUMED].
- **Silent ambiguity acceptance:** Accepting uncertain location/date values without clarification violates phase decisions D-07/D-08 [VERIFIED: local repo files].
- **Full-object overwrite on revision:** Replacing draft wholesale on single-field change drops accepted constraints and breaks D-10 [VERIFIED: local repo files].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complex date/time parsing | Regex-only parser for all date-window formats | Luxon `DateTime`/`Interval` with validity checks | Better invalid-reason handling and ISO parsing behavior [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md] |
| Runtime request validation | Manual `if/else` field checks in controllers | Nest `ValidationPipe` + `class-validator` decorators | Centralized, enforceable boundary validation [CITED: https://docs.nestjs.com/techniques/validation] |
| Canonical draft parsing | Ad-hoc object guards in many modules | Zod `safeParse` schemas | Deterministic parse result contract (`success` union) [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/basics.mdx] |
| Structured LLM output coercion | `JSON.parse` with retries and manual casts | OpenAI SDK structured helpers with schema parsing | Reduces schema drift and cast bugs in extraction layer [CITED: https://github.com/openai/openai-node/blob/master/helpers.md] |

**Key insight:** Phase 1 complexity is mostly edge-case normalization and auditability; standard validators/parsers are lower-risk than custom parsing logic [VERIFIED: local repo files] [ASSUMED].

## Common Pitfalls

### Pitfall 1: Ambiguous Slot Acceptance
**What goes wrong:** Similar place names or fuzzy date phrases are silently accepted as final constraints [VERIFIED: local repo files].  
**Why it happens:** Intake loop optimizes for speed, not confidence gating [ASSUMED].  
**How to avoid:** Track `status: ambiguous` and block confirmation until clarified [VERIFIED: local repo files].  
**Warning signs:** High post-recap correction rate on location/date fields [ASSUMED].

### Pitfall 2: Recap-Model Drift
**What goes wrong:** Recap text no longer matches canonical state after patches [VERIFIED: local repo files].  
**Why it happens:** Recap is incrementally edited as text instead of regenerated from source-of-truth [ASSUMED].  
**How to avoid:** Always regenerate full recap from canonical draft after each accepted revision [VERIFIED: local repo files].  
**Warning signs:** User reports “I changed one field but recap reverted others” [ASSUMED].

### Pitfall 3: Time Window Validation Gaps
**What goes wrong:** Invalid windows (`17:00-08:00`, non-localized parsing quirks) become accepted hard constraints [ASSUMED].  
**Why it happens:** Lack of strict parse + semantic validation (`start < end`) [ASSUMED].  
**How to avoid:** Parse with Luxon and reject invalid ranges before write [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md].  
**Warning signs:** Negative/zero ride-window duration in canonical draft [ASSUMED].

## Code Examples

Verified patterns from official sources:

### Global Validation Boundary (Nest)
```typescript
// Source: https://docs.nestjs.com/techniques/validation
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Deterministic Parse Without Throw (Zod)
```typescript
// Source: https://github.com/colinhacks/zod/blob/main/packages/docs/content/basics.mdx
const result = schema.safeParse(payload);
if (!result.success) {
  return { ok: false, issues: result.error.issues };
}
return { ok: true, data: result.data };
```

### Time Validity Check (Luxon)
```typescript
// Source: https://github.com/moment/luxon/blob/master/docs/parsing.md
import { DateTime } from 'luxon';

const parsed = DateTime.fromISO('2026-05-01T08:00:00+08:00');
if (!parsed.isValid) {
  throw new Error(parsed.invalidReason ?? 'invalid datetime');
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chat Completions as primary API shape | Responses API documented as primary in OpenAI Node SDK | openai-node current README (checked 2026-04-20) | Better alignment with current tool-capable API direction [CITED: https://github.com/openai/openai-node/blob/master/README.md] |
| Manual JSON coercion from model text | Structured parsing helpers with schemas | openai-node helpers docs | Reduces brittle parser logic in intake extraction [CITED: https://github.com/openai/openai-node/blob/master/helpers.md] |
| Request validation spread across handlers | Centralized global validation pipe | Nest validation docs | Fewer boundary inconsistencies and safer input contract [CITED: https://docs.nestjs.com/techniques/validation] |

**Deprecated/outdated:**
- Treating markdown recap text as the system state is outdated for deterministic planning systems; keep machine-readable canonical state and render views from it [VERIFIED: local repo files] [ASSUMED].

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `pino` should be introduced in Phase 1 for intake auditability | Standard Stack / Supporting | Could add unnecessary setup if logging is deferred to later phases |
| A2 | Recap/model drift is best prevented by full recap regeneration each revision | Common Pitfalls | Might constrain UX if partial recap strategy is desired |
| A3 | Time-window semantic validation should reject overnight windows by default | Common Pitfalls | Could conflict with product intent if overnight rides should be supported |

## Open Questions (RESOLVED)

1. **Persistence tier for canonical draft storage**
   - **Decision:** Phase 1 uses a DB/storage-backed repository adapter in-phase (PostgreSQL/Storage tier),
     not an in-memory runtime adapter, to satisfy D-05 traceability and Architectural Responsibility Map
     ownership.
   - **Plan impact:** `01-03-PLAN.md` Task 1 now explicitly requires DB/storage-backed persistence and
     forbids memory-backed runtime persistence.

2. **Constraint extraction strategy in Phase 1**
   - **Decision:** Phase 1 is deterministic parser-first (no LLM runtime dependency), while exposing an
     extractor contract so later phases can add an LLM-backed adapter behind the same interface.
   - **Plan impact:** `01-02-PLAN.md` adds an extractor interface and parser-first resolver behavior.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js runtime | Nest/Fastify app execution | ✓ | v22.18.0 | Use current Node for bootstrap; align to project target line before release [VERIFIED: local command output] [ASSUMED] |
| npm | Registry/version checks | ✓ | 10.9.3 | pnpm available [VERIFIED: local command output] |
| pnpm | Preferred package manager path | ✓ | 10.32.1 | npm [VERIFIED: local command output] |
| Docker | Optional local services (DB/Redis) | ✓ | 28.5.2 | Native local installs [VERIFIED: local command output] |
| `psql` CLI | Postgres direct ops/testing | ✗ | — | Use Dockerized Postgres client or app-level integration tests [VERIFIED: local command output] [ASSUMED] |
| `redis-cli` | Redis inspection/debug | ✗ | — | Use app logs and Docker container exec when Redis is added [VERIFIED: local command output] [ASSUMED] |
| `OPENAI_API_KEY` env | OpenAI SDK integration tests | ✗ | — | Mock extractor in tests until key is provisioned [VERIFIED: local command output] [ASSUMED] |

**Missing dependencies with no fallback:**
- None identified for planning artifact creation itself [VERIFIED: local command output].

**Missing dependencies with fallback:**
- `psql`, `redis-cli`, and `OPENAI_API_KEY` can be deferred with test doubles/local container workflows in early implementation [VERIFIED: local command output] [ASSUMED].

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 [VERIFIED: npm registry] |
| Config file | none — see Wave 0 [VERIFIED: local repo scan] |
| Quick run command | `pnpm vitest run tests/conversation --reporter=dot` [ASSUMED] |
| Full suite command | `pnpm vitest run` [ASSUMED] |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONV-01 | Origin/destination intake and confirmation gate | integration | `pnpm vitest run tests/conversation/intake-confirmation.test.ts -t "CONV-01"` | ❌ Wave 0 |
| CONV-02 | Waypoint parsing to normalized points | unit | `pnpm vitest run tests/constraints/waypoint-normalization.test.ts -t "CONV-02"` | ❌ Wave 0 |
| CONV-03 | Date range and trip day capture | unit | `pnpm vitest run tests/constraints/date-range.test.ts -t "CONV-03"` | ❌ Wave 0 |
| CONV-04 | Daily ride-window hard-constraint normalization | unit | `pnpm vitest run tests/constraints/ride-window.test.ts -t "CONV-04"` | ❌ Wave 0 |
| CONV-05 | Intensity profile to cap mapping | unit | `pnpm vitest run tests/constraints/intensity-profile.test.ts -t "CONV-05"` | ❌ Wave 0 |
| RELY-02 | Canonical model is source for recap rendering | integration | `pnpm vitest run tests/recap/canonical-projection.test.ts -t "RELY-02"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/conversation --reporter=dot` [ASSUMED]
- **Per wave merge:** `pnpm vitest run` [ASSUMED]
- **Phase gate:** Full suite green before `/gsd-verify-work` [VERIFIED: workflow convention from config + GSD process]

### Wave 0 Gaps
- [ ] `package.json` + Vitest config bootstrap (`vitest.config.ts`) — no runtime project scaffold exists yet [VERIFIED: local repo scan]
- [ ] `tests/conversation/intake-confirmation.test.ts` — covers CONV-01
- [ ] `tests/constraints/waypoint-normalization.test.ts` — covers CONV-02
- [ ] `tests/constraints/date-range.test.ts` — covers CONV-03
- [ ] `tests/constraints/ride-window.test.ts` — covers CONV-04
- [ ] `tests/constraints/intensity-profile.test.ts` — covers CONV-05
- [ ] `tests/recap/canonical-projection.test.ts` — covers RELY-02

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Out of explicit Phase 1 requirement scope [VERIFIED: local repo files] |
| V3 Session Management | yes | Conversation session IDs and server-side state isolation [ASSUMED] |
| V4 Access Control | yes | Scope draft reads/writes by conversation/session identity [ASSUMED] |
| V5 Input Validation | yes | Nest `ValidationPipe` + DTO decorators + schema parse [CITED: https://docs.nestjs.com/techniques/validation] |
| V6 Cryptography | no | No new cryptographic primitives required in Phase 1 scope [VERIFIED: local repo files] |

### Known Threat Patterns for Node/Nest chat intake

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Overposting/unexpected fields in payload | Tampering | `whitelist: true` + `forbidNonWhitelisted: true` [CITED: https://docs.nestjs.com/techniques/validation] |
| Prompt-injected constraint values causing unsafe state writes | Tampering | Validate extracted payload against canonical schema before persistence [CITED: https://github.com/colinhacks/zod/blob/main/packages/docs/content/basics.mdx] [ASSUMED] |
| Time/date parse ambiguity leading to invalid hard constraints | Denial of Service | Strict parse + invalidity rejection (`isValid`) [CITED: https://github.com/moment/luxon/blob/master/docs/parsing.md] |
| Cross-session draft mutation | Elevation of Privilege | Session-scoped repository methods and audit metadata per update [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- `/nestjs/docs.nestjs.com` (Context7) - validation pipe behavior and recommended options.
- `/fastify/fastify` (Context7) - schema validation/serialization model and Ajv/serializer references.
- `/moment/luxon` (Context7) + Luxon official docs - parsing and validity semantics.
- `/typestack/class-validator` (Context7) + official README - decorator validation capabilities.
- `/colinhacks/zod` (Context7) + official docs - `safeParse` and parse contract behavior.
- `/openai/openai-node` (Context7) + official README/helpers - Responses API and structured parsing helpers.
- npm registry (`npm view ...`) - package versions and publish timestamps.
- Local repository artifacts:
  - `.planning/phases/01-conversation-intake-and-constraint-model/01-CONTEXT.md`
  - `.planning/REQUIREMENTS.md`
  - `.planning/ROADMAP.md`
  - `.planning/STATE.md`
  - `AGENTS.md`
  - `.planning/config.json`

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions verified from npm and behavior verified from official docs.
- Architecture: MEDIUM-HIGH - strongly constrained by locked phase decisions; implementation layering specifics still discretionary.
- Pitfalls: MEDIUM - domain-aligned and partially verified from project context; some operational assumptions remain.

**Research date:** 2026-04-20  
**Valid until:** 2026-05-20 (stable framework area; recheck package versions before implementation start)
