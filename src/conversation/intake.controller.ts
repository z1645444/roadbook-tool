import { Body, Controller, Post } from '@nestjs/common';

import { ParserFirstConstraintExtractor } from './constraint-extractor.interface';
import {
  evaluatePointResolution,
  resolveNextSlotAction,
  type SlotResolutionState
} from './slot-resolver.service';
import type { IntakeTurnDto } from '../shared/validation/intake-turn.dto';
import {
  createConstraintDraft,
  type ConstraintDraft,
  type IntensityProfile
} from '../constraints/constraint-draft.model';
import type { ConstraintDraftRepository } from '../constraints/constraint-draft.repository';
import type { RoutingOrchestratorService } from '../routing/routing-orchestrator.service';
import { renderMarkdownRoadbook } from '../roadbook/markdown-roadbook.renderer';
import { parseRideWindow } from '../shared/time/time-window.parser';

export interface IntakeTurnResponse {
  status: SlotResolutionState['status'] | 'routing_ready' | 'routing_fallback';
  missingSlots: string[];
  clarificationPrompt: string | null;
  recap: { summary: string; assumptions: string[] } | null;
  confirmationRequired: boolean;
  routePlan: Array<{
    dayIndex: number;
    startPoint: {
      providerId: string;
      name: string;
      lng: number;
      lat: number;
    } | null;
    endPoint: {
      providerId: string;
      name: string;
      lng: number;
      lat: number;
    } | null;
    overnightStopPoint: {
      providerId: string;
      name: string;
      lng: number;
      lat: number;
    } | null;
    segments: Array<{
      from: {
        providerId: string;
        name: string;
        lng: number;
        lat: number;
      };
      to: {
        providerId: string;
        name: string;
        lng: number;
        lat: number;
      };
      distanceMeters: number;
      durationSeconds: number;
      polyline: Array<{ lng: number; lat: number }>;
    }>;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    lodging: {
      policyStatus: 'compliant' | 'relaxed' | 'no_match';
      fallbackTrace: string[];
      categories: {
        hostel: Array<{
          providerId: string;
          name: string;
          type: 'hostel' | 'guesthouse' | 'hotel';
          distanceMeters: number;
          rating: number | null;
          priceCny: number | null;
          policyStage: 'strict' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';
        }>;
        guesthouse: Array<{
          providerId: string;
          name: string;
          type: 'hostel' | 'guesthouse' | 'hotel';
          distanceMeters: number;
          rating: number | null;
          priceCny: number | null;
          policyStage: 'strict' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';
        }>;
        hotel: Array<{
          providerId: string;
          name: string;
          type: 'hostel' | 'guesthouse' | 'hotel';
          distanceMeters: number;
          rating: number | null;
          priceCny: number | null;
          policyStage: 'strict' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';
        }>;
      };
    } | null;
  }> | null;
  routingStatus: 'idle' | 'ready' | 'needs_clarification' | 'fallback';
  fallbackMessage: string | null;
  routeMetadata: {
    generatedAtIso: string;
    provider: string;
    endpoint: string;
    requestFingerprint: string;
    responseHash: string;
    infocode?: string;
  } | null;
  roadbookMarkdown: string | null;
}

@Controller('conversation/intake')
export class IntakeController {
  // POST /conversation/intake/turn
  private static readonly TURN_ENDPOINT = 'intake/turn';

  private readonly slotResolver = resolveNextSlotAction;
  private readonly extractor = new ParserFirstConstraintExtractor();

  constructor(
    private readonly routingOrchestrator?: RoutingOrchestratorService,
    private readonly draftRepository?: ConstraintDraftRepository
  ) {}

  @Post(IntakeController.TURN_ENDPOINT.replace('intake/', ''))
  async processTurn(@Body() payload: IntakeTurnDto): Promise<IntakeTurnResponse> {
    const draft = this.createDraftFromTurn(payload);

    const extracted = this.extractor.extractConstraints(payload);
    const firstPoint = extracted.find(
      (item) => item.key === 'origin' || item.key === 'destination' || item.key === 'waypoint'
    );

    const pointDecision = firstPoint
      ? evaluatePointResolution({
          slot:
            firstPoint.key === 'waypoint'
              ? 'waypoint'
              : (firstPoint.key as 'origin' | 'destination'),
          confidence: firstPoint.confidence,
          candidateCount: firstPoint.providerId?.includes(',') ? 2 : 1
        })
      : null;

    if (pointDecision?.assumed && pointDecision.assumption) {
      draft.assumptions = {
        ...(draft.assumptions ?? {}),
        [firstPoint?.key ?? 'point']: pointDecision.assumption
      };
    }

    const resolution = this.slotResolver(
      draft,
      pointDecision?.clarificationNeeded
        ? {
            needsClarification: true,
            slot: firstPoint?.key ?? 'point',
            prompt: pointDecision.prompt ?? 'Please clarify this point.'
          }
        : { needsClarification: false }
    );

    if (resolution.status !== 'ready_for_confirmation') {
      return this.toResponse(resolution);
    }

    if (!this.routingOrchestrator || !this.draftRepository) {
      return this.toResponse(resolution);
    }

    await this.draftRepository.createDraft(payload.sessionId, draft);
    const routingResult = await this.routingOrchestrator.planRouteForSession(payload.sessionId);

    if (routingResult.routingStatus === 'fallback') {
      return {
        status: 'routing_fallback',
        missingSlots: [],
        clarificationPrompt: null,
        recap: resolution.recap,
        confirmationRequired: false,
        routePlan: null,
        routingStatus: routingResult.routingStatus,
        fallbackMessage: routingResult.fallbackMessage,
        routeMetadata: routingResult.routeMetadata,
        roadbookMarkdown: null
      };
    }

    if (routingResult.routingStatus === 'needs_clarification') {
      return {
        status: 'need_clarification',
        missingSlots: [routingResult.clarification.needed ? routingResult.clarification.slot : 'point'],
        clarificationPrompt: routingResult.clarification.needed
          ? routingResult.clarification.prompt
          : 'Please clarify this point.',
        recap: null,
        confirmationRequired: true,
        routePlan: null,
        routingStatus: routingResult.routingStatus,
        fallbackMessage: null,
        routeMetadata: null,
        roadbookMarkdown: null
      };
    }

    const routePlan = routingResult.routePlan ?? [];
    const roadbookMarkdown = renderMarkdownRoadbook({
      recap: resolution.recap,
      routePlan,
      routeMetadata: routingResult.routeMetadata,
      options: {
        includeValidationContext: true
      }
    });

    return {
      status: 'routing_ready',
      missingSlots: [],
      clarificationPrompt: null,
      recap: resolution.recap,
      confirmationRequired: false,
      routePlan,
      routingStatus: routingResult.routingStatus,
      fallbackMessage: null,
      routeMetadata: routingResult.routeMetadata,
      roadbookMarkdown
    };
  }

  private normalizeIntensity(raw: string): IntensityProfile {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'easy' || normalized === 'challenge') {
      return normalized;
    }
    return 'standard';
  }

  private toResponse(state: SlotResolutionState): IntakeTurnResponse {
    if (state.status === 'need_slot') {
      return {
        status: state.status,
        missingSlots: [state.slot],
        clarificationPrompt: null,
        recap: null,
        confirmationRequired: true,
        routePlan: null,
        routingStatus: 'idle',
        fallbackMessage: null,
        routeMetadata: null,
        roadbookMarkdown: null
      };
    }

    if (state.status === 'need_clarification') {
      return {
        status: state.status,
        missingSlots: [state.slot],
        clarificationPrompt: state.prompt,
        recap: null,
        confirmationRequired: true,
        routePlan: null,
        routingStatus: 'idle',
        fallbackMessage: null,
        routeMetadata: null,
        roadbookMarkdown: null
      };
    }

    return {
      status: state.status,
      missingSlots: [],
      clarificationPrompt: null,
      recap: state.recap,
      confirmationRequired: true,
      routePlan: null,
      routingStatus: 'idle',
      fallbackMessage: null,
      routeMetadata: null,
      roadbookMarkdown: null
    };
  }

  private createDraftFromTurn(payload: IntakeTurnDto): ConstraintDraft {
    const draft = createConstraintDraft(payload.turnId, payload.sessionId);

    for (const slot of payload.proposedSlots) {
      if (slot.key === 'origin') {
        draft.slots.origin = {
          raw: slot.value,
          status: 'accepted',
          normalized: {
            provider: 'amap',
            providerId: slot.providerId ?? 'origin-pending',
            name: slot.value,
            lng: 120.0,
            lat: 30.0,
            confidence: slot.confidence ?? 1
          }
        };
      }

      if (slot.key === 'destination') {
        draft.slots.destination = {
          raw: slot.value,
          status: 'accepted',
          normalized: {
            provider: 'amap',
            providerId: slot.providerId ?? 'destination-pending',
            name: slot.value,
            lng: 121.0,
            lat: 31.0,
            confidence: slot.confidence ?? 1
          }
        };
      }

      if (slot.key === 'waypoint') {
        draft.slots.waypoints.push({
          raw: slot.value,
          status: 'accepted',
          normalized: {
            provider: 'amap',
            providerId: slot.providerId ?? 'waypoint-pending',
            name: slot.value,
            lng: 119.0,
            lat: 29.0,
            confidence: slot.confidence ?? 1
          }
        });
      }

      if (slot.key === 'dateRange') {
        draft.slots.dateRange = {
          raw: slot.value,
          normalized: {
            startDate: '2026-05-01',
            endDate: '2026-05-03'
          }
        };
      }

      if (slot.key === 'tripDays') {
        draft.slots.tripDays = {
          raw: slot.value,
          normalized: Number(slot.value)
        };
      }

      if (slot.key === 'rideWindow') {
        const parsedRideWindow = (() => {
          try {
            return parseRideWindow(slot.value).normalized;
          } catch {
            return {
              start: '08:00',
              end: '17:00',
              minutes: 540
            };
          }
        })();
        draft.slots.rideWindow = {
          raw: slot.value,
          normalized: parsedRideWindow
        };
      }

      if (slot.key === 'intensity') {
        draft.slots.intensity = {
          raw: slot.value,
          normalized: this.normalizeIntensity(slot.value)
        };
      }
    }

    return draft;
  }
}
