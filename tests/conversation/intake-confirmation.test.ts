import { describe, expect, it } from 'vitest';

import { IntakeController } from '../../src/conversation/intake.controller';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { resolveNextSlotAction } from '../../src/conversation/slot-resolver.service';

describe('CONV-01 intake confirmation resolver', () => {
  it('should ask for origin when required slot is missing', () => {
    const draft = createConstraintDraft('d1', 's1');

    const next = resolveNextSlotAction(draft);

    expect(next.status).toBe('need_slot');
    if (next.status === 'need_slot') {
      expect(next.slot).toBe('origin');
    }
  });

  it('should not re-ask accepted fields in subsequent turns', () => {
    const draft = createConstraintDraft('d2', 's2');
    draft.slots.origin = {
      raw: '上海',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'poi-1',
        name: '上海',
        lng: 121.47,
        lat: 31.23,
        confidence: 0.98
      }
    };

    const next = resolveNextSlotAction(draft);

    expect(next.status).toBe('need_slot');
    if (next.status === 'need_slot') {
      expect(next.slot).toBe('destination');
    }
  });

  it('should emit ready_for_confirmation only when all required slots are accepted', () => {
    const draft = createConstraintDraft('d3', 's3');
    draft.slots.origin = {
      raw: '北京',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'poi-a',
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
        providerId: 'poi-b',
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

    const next = resolveNextSlotAction(draft);

    expect(next.status).toBe('ready_for_confirmation');
    if (next.status === 'ready_for_confirmation') {
      expect(next.confirmationRequired).toBe(true);
    }
  });
});

describe('intake/turn controller confirmation gate', () => {
  it('should return confirmationRequired and cannot proceed without confirmation', () => {
    const controller = new IntakeController();

    const response = controller.processTurn({
      sessionId: 'session-1',
      turnId: 'turn-1',
      message: 'trip setup',
      proposedSlots: [
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'waypoint', value: '苏州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-03', confidence: 1 },
        { key: 'tripDays', value: '3', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.confirmationRequired).toBe(true);
    expect(response.status).toBe('ready_for_confirmation');
  });

  it('should return clarificationPrompt when point ambiguity is present', () => {
    const controller = new IntakeController();

    const response = controller.processTurn({
      sessionId: 'session-2',
      turnId: 'turn-2',
      message: 'ambiguous waypoint',
      proposedSlots: [
        { key: 'waypoint', value: '人民广场', confidence: 0.99, providerId: 'a,b' }
      ]
    });

    expect(response.status).toBe('need_clarification');
    expect(response.clarificationPrompt).toMatch(/clarify/i);
    expect(response.confirmationRequired).toBe(true);
  });
});
