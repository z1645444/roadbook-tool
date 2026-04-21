import type { ConstraintDraft } from '../constraints/constraint-draft.model';

import {
  evaluateClarificationNeed,
  type ClarificationDecision
} from './clarification-policy.service';

export interface RecapPayload {
  summary: string;
  assumptions: string[];
}

export type SlotResolutionState =
  | { status: 'need_slot'; slot: string }
  | { status: 'need_clarification'; slot: string; prompt: string; clarification: true }
  | {
      status: 'ready_for_confirmation';
      recap: RecapPayload;
      confirmationRequired: true;
      missingSlots: [];
    };

const REQUIRED_SLOT_ORDER: Array<keyof ConstraintDraft['slots']> = [
  'origin',
  'destination',
  'waypoints',
  'dateRange',
  'tripDays',
  'rideWindow',
  'intensity'
];

const slotIsAccepted = (
  draft: ConstraintDraft,
  slot: keyof ConstraintDraft['slots']
): boolean => {
  if (slot === 'waypoints') {
    return Array.isArray(draft.slots.waypoints);
  }

  const value = draft.slots[slot];

  if (!value) {
    return false;
  }

  if (slot === 'origin' || slot === 'destination') {
    return (
      typeof value === 'object' &&
      'status' in value &&
      value.status === 'accepted'
    );
  }

  return true;
};

export interface ClarificationEvaluation {
  needsClarification: boolean;
  slot?: string;
  prompt?: string;
}

export interface PointResolutionInput {
  slot: 'origin' | 'destination' | 'waypoint';
  confidence: number;
  candidateCount: number;
}

export const evaluatePointResolution = (
  input: PointResolutionInput
): ClarificationDecision => evaluateClarificationNeed(input.slot, input.confidence, input.candidateCount);

export const resolveNextSlotAction = (
  draft: ConstraintDraft,
  clarification: ClarificationEvaluation = { needsClarification: false }
): SlotResolutionState => {
  if (clarification.needsClarification && clarification.slot && clarification.prompt) {
    return {
      status: 'need_clarification',
      slot: clarification.slot,
      prompt: clarification.prompt,
      clarification: true
    };
  }

  for (const slot of REQUIRED_SLOT_ORDER) {
    if (!slotIsAccepted(draft, slot)) {
      return {
        status: 'need_slot',
        slot
      };
    }
  }

  return {
    status: 'ready_for_confirmation',
    recap: {
      summary: 'All required slots captured',
      assumptions: Object.entries(draft.assumptions ?? {}).map(
        ([key, value]) => `${key} assumption: ${value}`
      )
    },
    confirmationRequired: true,
    missingSlots: []
  };
};
