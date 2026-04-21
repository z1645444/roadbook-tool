import type { ConstraintDraftRepository } from '../constraints/constraint-draft.repository';
import type { MapProvider } from '../map-provider/map-provider.port';
import { buildOrderedSegments } from './segment-routing.service';
import { buildRouteGenerationMetadata } from '../reliability/repro-metadata.service';
import { RoutingFallbackError } from '../reliability/routing-fallback.error';
import { optimizeWaypointSequence } from './waypoint-optimizer.service';
import { splitRouteIntoDayStages } from './day-stage-splitter.service';

interface ClarificationPayload {
  needed: true;
  slot: string;
  candidateCount: number;
  prompt: string;
}

interface RoutingReadyPayload {
  needed: false;
}

interface RouteDayPlan {
  dayIndex: number;
  startPoint: Awaited<ReturnType<typeof buildOrderedSegments>>['segments'][number]['from'] | null;
  endPoint: Awaited<ReturnType<typeof buildOrderedSegments>>['segments'][number]['to'] | null;
  overnightStopPoint:
    | Awaited<ReturnType<typeof buildOrderedSegments>>['segments'][number]['to']
    | null;
  segments: Awaited<ReturnType<typeof buildOrderedSegments>>['segments'];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

export interface RoutingOrchestratorResult {
  routingStatus: 'ready' | 'needs_clarification' | 'fallback';
  routePlan: RouteDayPlan[] | null;
  fallbackMessage: string | null;
  routeMetadata: ReturnType<typeof buildRouteGenerationMetadata> | null;
  clarification: ClarificationPayload | RoutingReadyPayload;
}

export class RoutingOrchestratorService {
  constructor(
    private readonly provider: MapProvider,
    private readonly repository: ConstraintDraftRepository
  ) {}

  async planRouteForSession(sessionId: string): Promise<RoutingOrchestratorResult> {
    const draft = await this.repository.getBySessionId(sessionId);
    if (!draft) {
      throw new Error(`No canonical draft found for session ${sessionId}`);
    }

    const origin = draft.slots.origin?.normalized;
    const destination = draft.slots.destination?.normalized;
    if (!origin || !destination) {
      return {
        routingStatus: 'needs_clarification',
        routePlan: null,
        fallbackMessage: null,
        routeMetadata: null,
        clarification: {
          needed: true,
          slot: !origin ? 'origin' : 'destination',
          candidateCount: 0,
          prompt: '请先确认起点和终点后再生成路线。'
        }
      };
    }

    const acceptedPoints = [
      origin,
      ...draft.slots.waypoints
        .map((item) => item.normalized)
        .filter((item): item is typeof origin => Boolean(item)),
      destination
    ];
    const disambiguatedPoints = [];
    for (const point of acceptedPoints) {
      const geocode = await this.provider.geocodePoint({ query: point.name });
      if (geocode.candidates.length > 1) {
        return {
          routingStatus: 'needs_clarification',
          routePlan: null,
          fallbackMessage: null,
          routeMetadata: null,
          clarification: {
            needed: true,
            slot: point.name,
            candidateCount: geocode.candidates.length,
            prompt: `发现多个地点候选：${point.name}，请先确认具体位置。`
          }
        };
      }

      if (geocode.candidates.length === 1) {
        disambiguatedPoints.push(geocode.candidates[0]);
        continue;
      }

      disambiguatedPoints.push(point);
    }

    try {
      const tripDays = draft.slots.tripDays?.normalized ?? 1;
      const pointsForRouting =
        tripDays > 1
          ? (await optimizeWaypointSequence(disambiguatedPoints, this.provider)).optimizedPoints
          : disambiguatedPoints;
      const segmentResult = await buildOrderedSegments(pointsForRouting, this.provider);
      const routeMetadata = buildRouteGenerationMetadata({
        provider: 'amap',
        endpoint: '/v4/direction/bicycling',
        requestPayload: disambiguatedPoints.map((item) => ({
          providerId: item.providerId,
          lng: item.lng,
          lat: item.lat
        })),
        responsePayload: {
          totalDistanceMeters: segmentResult.totalDistanceMeters,
          totalDurationSeconds: segmentResult.totalDurationSeconds,
          segmentCount: segmentResult.segments.length
        }
      });

      await this.repository.updateDraft(sessionId, (currentDraft) => {
        const history = [...(currentDraft.routeGeneration?.history ?? []), routeMetadata].slice(-20);
        return {
          ...currentDraft,
          routeGeneration: {
            latest: routeMetadata,
            history
          }
        };
      });

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

      return {
        routingStatus: 'ready',
        routePlan,
        fallbackMessage: null,
        routeMetadata,
        clarification: { needed: false }
      };
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
  }
}
