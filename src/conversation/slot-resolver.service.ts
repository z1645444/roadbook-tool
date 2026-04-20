import type { ConstraintDraft } from '../constraints/constraint-draft.model';

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
  const value = draft.slots[slot];

  if (!value) {
    return false;
  }

  if (slot === 'waypoints') {
    return Array.isArray(value);
  }

  if (slot === 'origin' || slot === 'destination') {
    return value.status === 'accepted';
  }

  return true;
};

export interface ClarificationEvaluation {
  needsClarification: boolean;
  slot?: string;
  prompt?: string;
}

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
        ([key, value]) => `${key}: ${value}`
      )
    },
    confirmationRequired: true,
    missingSlots: []
  };
};
