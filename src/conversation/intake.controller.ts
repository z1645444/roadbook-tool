import { Body, Controller, Post } from '@nestjs/common';

import { ParserFirstConstraintExtractor } from './constraint-extractor.interface';
import {
  evaluatePointResolution,
  resolveNextSlotAction,
  type SlotResolutionState
} from './slot-resolver.service';
import type { IntakeTurnDto } from '../shared/validation/intake-turn.dto';
import { createConstraintDraft, type ConstraintDraft } from '../constraints/constraint-draft.model';

export interface IntakeTurnResponse {
  status: SlotResolutionState['status'];
  missingSlots: string[];
  clarificationPrompt: string | null;
  recap: { summary: string; assumptions: string[] } | null;
  confirmationRequired: boolean;
}

@Controller('conversation/intake')
export class IntakeController {
  // POST /conversation/intake/turn
  private static readonly TURN_ENDPOINT = 'intake/turn';

  private readonly slotResolver = resolveNextSlotAction;
  private readonly extractor = new ParserFirstConstraintExtractor();

  @Post(IntakeController.TURN_ENDPOINT.replace('intake/', ''))
  processTurn(@Body() payload: IntakeTurnDto): IntakeTurnResponse {
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

    return this.toResponse(resolution);
  }

  private toResponse(state: SlotResolutionState): IntakeTurnResponse {
    if (state.status === 'need_slot') {
      return {
        status: state.status,
        missingSlots: [state.slot],
        clarificationPrompt: null,
        recap: null,
        confirmationRequired: true
      };
    }

    if (state.status === 'need_clarification') {
      return {
        status: state.status,
        missingSlots: [state.slot],
        clarificationPrompt: state.prompt,
        recap: null,
        confirmationRequired: true
      };
    }

    return {
      status: state.status,
      missingSlots: [],
      clarificationPrompt: null,
      recap: state.recap,
      confirmationRequired: true
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
        draft.slots.rideWindow = {
          raw: slot.value,
          normalized: {
            start: '08:00',
            end: '17:00',
            minutes: 540
          }
        };
      }

      if (slot.key === 'intensity') {
        draft.slots.intensity = {
          raw: slot.value,
          normalized: 'standard'
        };
      }
    }

    return draft;
  }
}
