import { describe, expect, it } from 'vitest';

import {
  MIN_ACCEPT_CONFIDENCE,
  evaluateClarificationNeed
} from '../../src/conversation/clarification-policy.service';
import {
  evaluatePointResolution,
  resolveNextSlotAction
} from '../../src/conversation/slot-resolver.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';

describe('CONV-02 waypoint normalization and ambiguity handling', () => {
  it('should force a blocking clarification response for ambiguous waypoint candidates', () => {
    const decision = evaluatePointResolution({
      slot: 'waypoint',
      confidence: 0.99,
      candidateCount: 2
    });

    expect(decision.ambiguous).toBe(true);
    expect(decision.clarificationNeeded).toBe(true);
    expect(decision.disposition).toBe('ambiguous');
  });

  it('should trigger clarification for low-confidence values', () => {
    const decision = evaluateClarificationNeed('waypoint', MIN_ACCEPT_CONFIDENCE - 0.1, 1);

    expect(decision.clarificationNeeded).toBe(true);
    expect(decision.ambiguous).toBe(true);
  });

  it('should include assumption metadata for inferred values and surface it in recap', () => {
    const decision = evaluateClarificationNeed('waypoint', 0.9, 1);
    expect(decision.assumed).toBe(true);
    expect(decision.assumption).toMatch(/Assumed waypoint/i);

    const draft = createConstraintDraft('draft-assume', 'session-assume');
    draft.assumptions = {
      waypoint: decision.assumption ?? 'Assumed waypoint from nearby match'
    };
    draft.slots.origin = {
      raw: '北京',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'poi-1',
        name: '北京',
        lng: 116.4,
        lat: 39.9,
        confidence: 0.99
      }
    };
    draft.slots.destination = {
      raw: '杭州',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'poi-2',
        name: '杭州',
        lng: 120.2,
        lat: 30.25,
        confidence: 0.98
      }
    };
    draft.slots.waypoints = [];
    draft.slots.dateRange = {
      raw: '2026-05-01 to 2026-05-03',
      normalized: {
        startDate: '2026-05-01',
        endDate: '2026-05-03'
      }
    };
    draft.slots.tripDays = {
      raw: '3',
      normalized: 3
    };
    draft.slots.rideWindow = {
      raw: '08:00-17:00',
      normalized: {
        start: '08:00',
        end: '17:00',
        minutes: 540
      }
    };
    draft.slots.intensity = {
      raw: 'standard',
      normalized: 'standard'
    };

    const state = resolveNextSlotAction(draft);
    expect(state.status).toBe('ready_for_confirmation');
    if (state.status === 'ready_for_confirmation') {
      expect(state.recap.assumptions.join(' ')).toMatch(/assumption/i);
    }
  });
});
