import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { IntakeController } from '../../src/conversation/intake.controller';
import { resolveNextSlotAction } from '../../src/conversation/slot-resolver.service';
import { applyConstraintPatch } from '../../src/constraints/constraint-patch.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import { buildConstraintRecap } from '../../src/recap/recap-projection.service';
import type { MapProvider } from '../../src/map-provider/map-provider.port';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';

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
  it('should return confirmationRequired and keep routing idle when orchestrator is not wired', async () => {
    const controller = new IntakeController();

    const response = await controller.processTurn({
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
    expect(response.routingStatus).toBe('idle');
    expect(response.roadbookMarkdown).toBeNull();
  });

  it('should return clarificationPrompt when point ambiguity is present', async () => {
    const controller = new IntakeController();

    const response = await controller.processTurn({
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
    expect(response.roadbookMarkdown).toBeNull();
  });

  it('should trigger routing orchestrator after confirmation-ready state', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-controller-routing-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-id`,
              name: input.query,
              lng: input.query === '北京' ? 116.4 : 120.2,
              lat: input.query === '北京' ? 39.9 : 30.25,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment() {
        return {
          distanceMeters: 2000,
          durationSeconds: 480,
          polyline: [
            { lng: 116.4, lat: 39.9 },
            { lng: 120.2, lat: 30.25 }
          ]
        };
      }
    };

    const orchestrator = new RoutingOrchestratorService(provider, repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'session-3',
      turnId: 'turn-3',
      message: 'confirmed trip',
      proposedSlots: [
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.confirmationRequired).toBe(false);
    expect(response.status).toBe('routing_ready');
    expect(response.routingStatus).toBe('ready');
    expect(response.routePlan).not.toBeNull();
    expect(response.routePlan?.[0]?.startPoint?.providerId).toContain('北京');
    expect(response.routePlan?.[0]?.endPoint?.providerId).toContain('杭州');
    expect(response.routePlan?.[0]?.overnightStopPoint).toBeNull();
    expect(response.fallbackMessage).toBeNull();
    expect(response.routeMetadata).not.toBeNull();
    expect(response.roadbookMarkdown).toContain('## Day 1');
    expect(response.roadbookMarkdown).toContain('Route: 北京 -> 杭州');
  });

  it('BOOK-01 and BOOK-03 should include routePlan lodging categories and fallbackTrace on multiday routing_ready response', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-controller-lodging-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const provider: MapProvider = {
      async geocodePoint(input) {
        const lookup: Record<string, { providerId: string; lng: number; lat: number }> = {
          北京: { providerId: 'origin', lng: 116.4, lat: 39.9 },
          途经点: { providerId: 'waypoint', lng: 116.9, lat: 39.95 },
          杭州: { providerId: 'destination', lng: 120.2, lat: 30.25 }
        };
        const item = lookup[input.query];
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: item.providerId,
              name: input.query,
              lng: item.lng,
              lat: item.lat,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment(input) {
        return {
          distanceMeters: 2800,
          durationSeconds: 1800,
          polyline: [input.from, input.to]
        };
      },
      async searchLodgingAround(input) {
        return {
          candidates: [
            {
              providerId: `${input.category}-ok`,
              name: `${input.category}-ok`,
              type: input.category,
              distanceMeters: 500,
              rating: 4.4,
              priceCny: input.category === 'hostel' ? 90 : 180,
              policyStage: 'strict'
            }
          ]
        };
      }
    };

    const orchestrator = new RoutingOrchestratorService(provider, repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'session-3-lodging',
      turnId: 'turn-3-lodging',
      message: 'confirmed multiday trip',
      proposedSlots: [
        { key: 'waypoint', value: '途经点', confidence: 0.99 },
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-02', confidence: 1 },
        { key: 'tripDays', value: '2', confidence: 1 },
        { key: 'rideWindow', value: '08:00-08:20', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('routing_ready');
    expect(response.routePlan).not.toBeNull();
    expect(response.routePlan?.[0]?.lodging).not.toBeNull();
    expect(response.routePlan?.[0]?.lodging?.categories.hostel[0]?.providerId).toBe('hostel-ok');
    expect(response.routePlan?.[0]?.lodging?.categories.guesthouse[0]?.providerId).toBe(
      'guesthouse-ok'
    );
    expect(response.routePlan?.[0]?.lodging?.categories.hotel[0]?.providerId).toBe('hotel-ok');
    expect(response.routePlan?.[0]?.lodging?.fallbackTrace).toContain('strict_8km');
    expect(response.roadbookMarkdown).toContain('## Day 1');
    expect(response.roadbookMarkdown).toContain('### 住宿建议');
    expect(response.roadbookMarkdown).toContain('hostel\\-ok | rating: 4.4 | price: 90 CNY');
    expect(response.roadbookMarkdown).toContain(
      'guesthouse\\-ok | rating: 4.4 | price: 180 CNY'
    );
    expect(response.roadbookMarkdown).toContain('hotel\\-ok | rating: 4.4 | price: 180 CNY');
  });

  it('BOOK-03 should not include lodging section for single-day route-ready markdown', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-controller-singleday-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-id`,
              name: input.query,
              lng: input.query === '北京' ? 116.4 : 120.2,
              lat: input.query === '北京' ? 39.9 : 30.25,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment(input) {
        return {
          distanceMeters: 4000,
          durationSeconds: 1200,
          polyline: [input.from, input.to]
        };
      },
      async searchLodgingAround() {
        return { candidates: [] };
      }
    };

    const orchestrator = new RoutingOrchestratorService(provider, repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'session-3-singleday',
      turnId: 'turn-3-singleday',
      message: 'single day trip',
      proposedSlots: [
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('routing_ready');
    expect(response.roadbookMarkdown).toContain('## Day 1');
    expect(response.roadbookMarkdown).not.toContain('### 住宿建议');
  });

  it('BOOK-04 should include constraints assumptions and validation context in roadbook markdown', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-controller-book04-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-id`,
              name: input.query,
              lng: input.query === '北京' ? 116.4 : 120.2,
              lat: input.query === '北京' ? 39.9 : 30.25,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment(input) {
        return {
          distanceMeters: 3000,
          durationSeconds: 900,
          polyline: [input.from, input.to]
        };
      },
      async searchLodgingAround() {
        return { candidates: [] };
      }
    };

    const orchestrator = new RoutingOrchestratorService(provider, repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'session-3-book04',
      turnId: 'turn-3-book04',
      message: 'route with assumption',
      proposedSlots: [
        { key: 'waypoint', value: '人民广场', confidence: 0.9, providerId: 'rmgc' },
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('routing_ready');
    expect(response.roadbookMarkdown).toContain('## 约束摘要');
    expect(response.roadbookMarkdown).toContain('## 假设与修正');
    expect(response.roadbookMarkdown).toContain('waypoint assumption');
    expect(response.roadbookMarkdown).toContain('修正路径');
    expect(response.roadbookMarkdown).toContain('## 校验上下文');
    expect(response.roadbookMarkdown).toContain('requestFingerprint');
    expect(response.roadbookMarkdown).toContain('responseHash');
  });

  it('should keep canonical recap consistent after single-field revision', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-revision-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const draft = createConstraintDraft('d4', 'session-4');
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
        confidence: 0.99
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

    await repository.createDraft(draft.sessionId, draft);

    const revised = await repository.updateDraft(draft.sessionId, (current) =>
      applyConstraintPatch(
        current,
        {
          intensity: {
            raw: 'challenge',
            normalized: 'challenge'
          }
        },
        'turn-revision-1',
        '2026-04-20T16:00:00Z'
      )
    );

    const recap = buildConstraintRecap(revised);

    expect(recap.summary).toContain('Origin: 北京');
    expect(recap.summary).toContain('Intensity: challenge');
    expect(revised.revisionLog.at(-1)?.turnId).toBe('turn-revision-1');
  });

  it('should surface assumption markers with a correction path in recap', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-assumption-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const draft = createConstraintDraft('d5', 'session-5');
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
    draft.assumptions = {
      waypoint: 'Assumed nearby district center'
    };

    await repository.createDraft(draft.sessionId, draft);
    const stored = await repository.getBySessionId(draft.sessionId);

    expect(stored).not.toBeNull();
    const recap = buildConstraintRecap(stored!);
    expect(recap.assumptionNotes.join(' ')).toMatch(/assumption/i);
    expect(recap.correctionPath).toMatch(/correction/i);
  });
});
