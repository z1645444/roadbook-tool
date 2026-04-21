# Phase 4: Lodging Recommendation Policy - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 9
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/map-provider/map-provider.port.ts` | provider | request-response | `src/map-provider/map-provider.port.ts` | exact |
| `src/map-provider/amap-lodging.adapter.ts` | provider | request-response | `src/map-provider/amap-geocode.adapter.ts` | exact |
| `src/routing/lodging-policy.service.ts` | service | transform | `src/routing/day-stage-splitter.service.ts` | role-match |
| `src/routing/routing-orchestrator.service.ts` | service | request-response | `src/routing/routing-orchestrator.service.ts` | exact |
| `src/shared/validation/multiday-route-artifact.schema.ts` | model | transform | `src/shared/validation/multiday-route-artifact.schema.ts` | exact |
| `tests/routing/lodging-policy.service.test.ts` | test | transform | `tests/routing/day-stage-split.test.ts` | role-match |
| `tests/map-provider/amap-lodging.adapter.test.ts` | test | request-response | `tests/reliability/amap-fallback-errors.test.ts` | role-match |
| `tests/routing/lodging-integration.test.ts` | test | request-response | `tests/routing/phase3-multiday-integration.test.ts` | exact |
| `tests/shared/validation/multiday-lodging-artifact.schema.test.ts` | test | transform | `tests/routing/day-stage-split.test.ts` | partial |

## Pattern Assignments

### `src/map-provider/map-provider.port.ts` (provider, request-response)

**Analog:** `src/map-provider/map-provider.port.ts`

**Interface expansion pattern** (`src/map-provider/map-provider.port.ts:1-42`):
```typescript
export interface GeocodePointInput {
  query: string;
  city?: string;
}

export interface BicyclingSegmentInput {
  from: BicyclingCoordinate;
  to: BicyclingCoordinate;
}

export interface MapProvider {
  geocodePoint(input: GeocodePointInput): Promise<GeocodePointResult>;
  routeBicyclingSegment(input: BicyclingSegmentInput): Promise<BicyclingSegmentResult>;
}
```

**Copy guidance:** add lodging input/result contracts in this file and extend `MapProvider` with
`searchLodgingAround(...)` in the same interface-first style.

---

### `src/map-provider/amap-lodging.adapter.ts` (provider, request-response)

**Analog:** `src/map-provider/amap-geocode.adapter.ts`
**Supporting analog:** `src/map-provider/amap-bicycling.adapter.ts`

**Imports + adapter class shape** (`src/map-provider/amap-geocode.adapter.ts:1-7`, `:38-45`):
```typescript
import type {
  GeocodeCandidate,
  GeocodePointInput,
  GeocodePointResult,
  MapProvider
} from './map-provider.port';
import { mapAmapError } from './amap-error.mapper';

export class AmapGeocodeAdapter implements Pick<MapProvider, 'geocodePoint'> {
  constructor(private readonly apiKey: string = process.env.AMAP_API_KEY ?? '') {
    if (!this.apiKey) {
      throw mapAmapError({ infocode: '10001', endpoint: 'geocode' });
    }
  }
}
```

**Query envelope + fetch + mapped error handling** (`src/map-provider/amap-geocode.adapter.ts:46-73`):
```typescript
const search = new URLSearchParams({
  key: this.apiKey,
  address: input.query
});

if (input.city) {
  search.set('city', input.city);
}

let response: Response;
try {
  response = await fetch(`${AMAP_GEOCODE_ENDPOINT}?${search.toString()}`);
} catch {
  throw mapAmapError({ endpoint: 'geocode' });
}

let payload: AmapGeocodeResponse;
try {
  payload = (await response.json()) as AmapGeocodeResponse;
} catch {
  throw mapAmapError({ endpoint: 'geocode' });
}

if (!response.ok || payload.status !== '1') {
  throw mapAmapError({ infocode: payload.infocode, info: payload.info, endpoint: 'geocode' });
}
```

**Response parsing + normalized DTO return** (`src/map-provider/amap-geocode.adapter.ts:75-93`):
```typescript
const candidates: GeocodeCandidate[] = (payload.geocodes ?? []).map((item, index) => {
  const coords = parseLocation(item.location);
  return {
    provider: 'amap',
    providerId: item.id ?? `${input.query}-${index}`,
    name: item.formatted_address ?? input.query,
    lng: coords.lng,
    lat: coords.lat,
    confidence: index === 0 ? 0.97 : 0.9
  };
});

return {
  candidates,
  infocode: payload.infocode,
  info: payload.info
};
```

**Copy guidance:** keep this exact adapter contract style for lodging (`Pick<MapProvider, ...>`),
with fixed `types`, `sortrule=distance`, timeout wrapper, and mapped provider errors.

---

### `src/routing/lodging-policy.service.ts` (service, transform)

**Analog:** `src/routing/day-stage-splitter.service.ts`
**Supporting analog:** `src/routing/waypoint-optimizer.service.ts`

**Typed service output pattern** (`src/routing/day-stage-splitter.service.ts:6-14`):
```typescript
export interface DayStagePlan {
  dayIndex: number;
  startPoint: OrderedRouteSegment['from'];
  endPoint: OrderedRouteSegment['to'];
  overnightStopPoint: OrderedRouteSegment['to'] | null;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  segments: OrderedRouteSegment[];
}
```

**Deterministic accumulate + reduce pattern** (`src/routing/day-stage-splitter.service.ts:43-63`):
```typescript
const totals = segments.reduce(
  (acc, segment) => ({
    totalDistanceMeters: acc.totalDistanceMeters + segment.distanceMeters,
    totalDurationSeconds: acc.totalDurationSeconds + segment.durationSeconds
  }),
  {
    totalDistanceMeters: 0,
    totalDurationSeconds: 0
  }
);
```

**Validation at boundary with detailed issues** (`src/routing/day-stage-splitter.service.ts:84-90`):
```typescript
const parsed = safeParseMultidayRouteArtifact(payload);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid day-stage artifact: ${issues}`);
}
```

**Deterministic ranking tie-breaker pattern** (`src/routing/waypoint-optimizer.service.ts:114-124`):
```typescript
const betterDistance = score.distanceMeters < best.score.distanceMeters;
const sameDistance = score.distanceMeters === best.score.distanceMeters;
const betterDuration = score.durationSeconds < best.score.durationSeconds;
const sameDuration = score.durationSeconds === best.score.durationSeconds;
const betterTieBreak = score.sortKey.localeCompare(best.score.sortKey) < 0;
```

**Copy guidance:** lodging policy should follow this deterministic transform style: normalize input,
filter by policy, rank by distance/rating/price, then validate and return typed payload.

---

### `src/routing/routing-orchestrator.service.ts` (service, request-response)

**Analog:** `src/routing/routing-orchestrator.service.ts`

**Dependency-injected service constructor** (`src/routing/routing-orchestrator.service.ts:40-44`):
```typescript
export class RoutingOrchestratorService {
  constructor(
    private readonly provider: MapProvider,
    private readonly repository: ConstraintDraftRepository
  ) {}
}
```

**Single-day vs multiday branching pattern** (`src/routing/routing-orchestrator.service.ts:102-149`):
```typescript
const tripDays = draft.slots.tripDays?.normalized ?? 1;
const pointsForRouting =
  tripDays > 1
    ? (await optimizeWaypointSequence(disambiguatedPoints, this.provider)).optimizedPoints
    : disambiguatedPoints;

const routePlan: RouteDayPlan[] =
  tripDays > 1
    ? splitRouteIntoDayStages(segmentResult.segments, draft, pointsForRouting)
    : [
        {
          dayIndex: 1,
          startPoint: segmentResult.segments[0]?.from ?? null,
          endPoint: segmentResult.segments.at(-1)?.to ?? null,
          overnightStopPoint: null,
          segments: segmentResult.segments,
          totalDistanceMeters: segmentResult.totalDistanceMeters,
          totalDurationSeconds: segmentResult.totalDurationSeconds
        }
      ];
```

**Fallback-safe error conversion pattern** (`src/routing/routing-orchestrator.service.ts:157-169`):
```typescript
} catch (error) {
  if (error instanceof RoutingFallbackError) {
    return {
      routingStatus: 'fallback',
      routePlan: null,
      fallbackMessage: error.userMessage,
      routeMetadata: null,
      clarification: { needed: false }
    };
  }
  throw error;
}
```

**Copy guidance:** integrate lodging only on multiday path (`overnightStopPoint` present), and keep
fallback behavior mapped to stable user-safe output.

---

### `src/shared/validation/multiday-route-artifact.schema.ts` (model, transform)

**Analog:** `src/shared/validation/multiday-route-artifact.schema.ts`
**Supporting analog:** `src/shared/validation/route-artifact.schema.ts`

**Zod composition pattern** (`src/shared/validation/multiday-route-artifact.schema.ts:3-16`):
```typescript
import { routePointSchema, routeSegmentSchema } from './route-artifact.schema';

export const dayBoundarySchema = z.object({
  dayIndex: z.number().int().positive(),
  startPoint: routePointSchema,
  endPoint: routePointSchema,
  overnightStopPoint: routePointSchema.nullable()
});

export const multidayDayStageSchema = dayBoundarySchema.extend({
  totalDistanceMeters: z.number().nonnegative(),
  totalDurationSeconds: z.number().nonnegative(),
  segments: z.array(routeSegmentSchema)
});
```

**Exported parser helper pattern** (`src/shared/validation/multiday-route-artifact.schema.ts:23-32`):
```typescript
export const multidayRouteArtifactSchema = z.object({
  optimizedPoints: z.array(routePointSchema).min(2),
  days: z.array(multidayDayStageSchema),
  totals: multidayTotalsSchema
});

export type MultidayRouteArtifact = z.infer<typeof multidayRouteArtifactSchema>;

export const safeParseMultidayRouteArtifact = (payload: unknown) =>
  multidayRouteArtifactSchema.safeParse(payload);
```

**Copy guidance:** extend current multiday schema with `lodging` day-level payload using this
`z.object(...).extend(...)` style and keep the exported `safeParse...` helper.

---

### `tests/routing/lodging-policy.service.test.ts` (test, transform)

**Analog:** `tests/routing/day-stage-split.test.ts`

**Test fixture builders pattern** (`tests/routing/day-stage-split.test.ts:8-31`):
```typescript
const point = (providerId: string, lng: number, lat: number): GeocodeCandidate => ({
  provider: 'amap',
  providerId,
  name: providerId,
  lng,
  lat,
  confidence: 0.99
});

const segment = (
  from: GeocodeCandidate,
  to: GeocodeCandidate,
  durationSeconds: number,
  distanceMeters = 1000
): OrderedRouteSegment => ({
  from,
  to,
  durationSeconds,
  distanceMeters,
  polyline: [
    { lng: from.lng, lat: from.lat },
    { lng: to.lng, lat: to.lat }
  ]
});
```

**Requirement-style assertion pattern** (`tests/routing/day-stage-split.test.ts:33-64`):
```typescript
describe('ROUT-04 day-stage split', () => {
  it('should enforce ride-window and intensity cap with explicit day boundary fields', () => {
    // ...
    expect(days).toHaveLength(2);
    expect(days[0].overnightStopPoint?.providerId).toBe('wp2');
    expect(days[1].overnightStopPoint).toBeNull();
  });
});
```

**Copy guidance:** build policy tests with deterministic fixtures and requirement-keyed test titles
(`LODG-02/03/04/05`) focused on filter/rank/fallback behavior.

---

### `tests/map-provider/amap-lodging.adapter.test.ts` (test, request-response)

**Analog:** `tests/reliability/amap-fallback-errors.test.ts`

**Global fetch mocking pattern** (`tests/reliability/amap-fallback-errors.test.ts:37-53`):
```typescript
const originalFetch = global.fetch;
global.fetch = async () => {
  throw new Error('network failed');
};

try {
  const adapter = new AmapGeocodeAdapter('test-key');
  await expect(adapter.geocodePoint({ query: '北京' })).rejects.toMatchObject({
    category: 'unknown_provider_error'
  });
} finally {
  global.fetch = originalFetch;
}
```

**Mapped error assertion pattern** (`tests/reliability/amap-fallback-errors.test.ts:56-74`):
```typescript
global.fetch = async () =>
  ({
    ok: false,
    json: async () => ({ errcode: 10029, errmsg: 'too many requests' })
  } as Response);

await expect(
  adapter.routeBicyclingSegment({ from: { lng: 120.1, lat: 30.2 }, to: { lng: 120.2, lat: 30.3 } })
).rejects.toMatchObject({ category: 'rate_limited' });
```

**Copy guidance:** verify timeout/transport/non-OK payloads are always converted by
`mapAmapError`, and verify `types + sortrule + paging` query envelope.

---

### `tests/routing/lodging-integration.test.ts` (test, request-response)

**Analog:** `tests/routing/phase3-multiday-integration.test.ts`

**Repository + orchestrator harness pattern** (`tests/routing/phase3-multiday-integration.test.ts:13-21`):
```typescript
const createHarness = async (provider: MapProvider) => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-phase3-e2e-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );
  const orchestrator = new RoutingOrchestratorService(provider, repository);
  const controller = new IntakeController(orchestrator, repository);
  return { controller };
};
```

**Inline provider stub pattern** (`tests/routing/phase3-multiday-integration.test.ts:41-82`):
```typescript
const provider: MapProvider = {
  async geocodePoint(input) {
    // deterministic lookup
    return { candidates: [/* ... */] };
  },
  async routeBicyclingSegment(input) {
    return {
      distanceMeters: 2000,
      durationSeconds: 1000,
      polyline: [input.from, input.to]
    };
  }
};
```

**Copy guidance:** add integration test that verifies lodging attaches per day, respects single-day
guard, and surfaces fallback/no-match trace in response payload.

---

### `tests/shared/validation/multiday-lodging-artifact.schema.test.ts` (test, transform)

**Analog:** `tests/routing/day-stage-split.test.ts` (closest existing schema-boundary assertion style)

**Simple pure-function assertion style** (`tests/routing/day-stage-split.test.ts:33-64`):
```typescript
describe('ROUT-04 day-stage split', () => {
  it('should enforce ride-window and intensity cap with explicit day boundary fields', () => {
    const days = splitRouteIntoDayStages(segments, draft, [origin, wp1, wp2, destination]);
    expect(days).toHaveLength(2);
    expect(days[0].dayIndex).toBe(1);
  });
});
```

**Copy guidance:** create a pure schema test file that exercises
`safeParseMultidayRouteArtifact` with valid/invalid lodging payloads and asserts `success` plus
issue presence for invalid cases.

## Shared Patterns

### Provider Error Mapping
**Source:** `src/map-provider/amap-error.mapper.ts:49-57`, `src/reliability/routing-fallback.error.ts:14-25`  
**Apply to:** `amap-lodging.adapter.ts`, lodging integration in orchestrator

```typescript
export const mapAmapError = ({ infocode, endpoint }: MapAmapErrorInput): RoutingFallbackError => {
  const category = resolveCategory(infocode);
  return new RoutingFallbackError({
    category,
    retryable: category !== 'auth_error' && category !== 'quota_error',
    userMessage: `${CATEGORY_MESSAGES[category]}（${endpoint}）`
  });
};
```

### Boundary Validation via `safeParse`
**Source:** `src/routing/day-stage-splitter.service.ts:84-90`, `src/routing/segment-routing.service.ts:25-33`  
**Apply to:** lodging policy output shaping and multiday schema extension

```typescript
const parsed = safeParseMultidayRouteArtifact(payload);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`Invalid day-stage artifact: ${issues}`);
}
```

### Multiday Guard + Deterministic Response Shape
**Source:** `src/routing/routing-orchestrator.service.ts:135-149`  
**Apply to:** lodging injection in orchestrator

```typescript
const routePlan: RouteDayPlan[] =
  tripDays > 1
    ? splitRouteIntoDayStages(segmentResult.segments, draft, pointsForRouting)
    : [
        {
          dayIndex: 1,
          startPoint: segmentResult.segments[0]?.from ?? null,
          endPoint: segmentResult.segments.at(-1)?.to ?? null,
          overnightStopPoint: null,
          segments: segmentResult.segments,
          totalDistanceMeters: segmentResult.totalDistanceMeters,
          totalDurationSeconds: segmentResult.totalDurationSeconds
        }
      ];
```

### Integration Test Harness
**Source:** `tests/routing/phase3-multiday-integration.test.ts:13-21`  
**Apply to:** `tests/routing/lodging-integration.test.ts`

```typescript
const createHarness = async (provider: MapProvider) => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-phase3-e2e-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );
  const orchestrator = new RoutingOrchestratorService(provider, repository);
  const controller = new IntakeController(orchestrator, repository);
  return { controller };
};
```

## No Analog Found

None.

## Metadata

**Analog search scope:** `src/map-provider`, `src/routing`, `src/shared/validation`, `tests/routing`, `tests/reliability`, `tests/shared/validation`  
**Files scanned:** 40  
**Pattern extraction date:** 2026-04-21
