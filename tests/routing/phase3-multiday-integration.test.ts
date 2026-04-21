import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { IntakeController } from '../../src/conversation/intake.controller';
import type { IntakeTurnDto } from '../../src/shared/validation/intake-turn.dto';
import type { MapProvider } from '../../src/map-provider/map-provider.port';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';

const createHarness = async (provider: MapProvider) => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-phase3-e2e-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );
  const orchestrator = new RoutingOrchestratorService(provider, repository);
  const controller = new IntakeController(orchestrator, repository);
  return { controller };
};

const basePayload: IntakeTurnDto = {
  sessionId: 'phase3-session',
  turnId: 'phase3-turn',
  message: 'phase3 integration',
  proposedSlots: [
    { key: 'origin', value: '北京', confidence: 0.99, providerId: 'origin' },
    { key: 'waypoint', value: '途经A', confidence: 0.99, providerId: 'wp-b' },
    { key: 'waypoint', value: '途经B', confidence: 0.99, providerId: 'wp-a' },
    { key: 'destination', value: '杭州', confidence: 0.99, providerId: 'destination' },
    { key: 'tripDays', value: '2', confidence: 1 },
    { key: 'dateRange', value: '2026-05-01 to 2026-05-02', confidence: 1 },
    { key: 'rideWindow', value: '08:00-08:20', confidence: 1 },
    { key: 'intensity', value: 'easy', confidence: 1 }
  ]
};

describe('ROUT-03 integration: multiday path applies waypoint optimization', () => {
  it('should optimize waypoint order deterministically before stage split', async () => {
    const provider: MapProvider = {
      async geocodePoint(input) {
        const dict: Record<string, { id: string; lng: number; lat: number }> = {
          北京: { id: 'origin', lng: 116.4, lat: 39.9 },
          途经A: { id: 'wp-b', lng: 116.6, lat: 39.92 },
          途经B: { id: 'wp-a', lng: 116.5, lat: 39.91 },
          杭州: { id: 'destination', lng: 120.2, lat: 30.25 }
        };
        const item = dict[input.query];
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: item.id,
              name: input.query,
              lng: item.lng,
              lat: item.lat,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment(input) {
        const fromId =
          input.from.lng === 116.4 ? 'origin' : input.from.lng === 116.5 ? 'wp-a' : input.from.lng === 116.6 ? 'wp-b' : 'destination';
        const toId =
          input.to.lng === 116.4 ? 'origin' : input.to.lng === 116.5 ? 'wp-a' : input.to.lng === 116.6 ? 'wp-b' : 'destination';
        const key = `${fromId}->${toId}`;
        const score: Record<string, number> = {
          'origin->wp-a': 1000,
          'origin->wp-b': 5000,
          'wp-a->wp-b': 1000,
          'wp-b->destination': 1000,
          'wp-a->destination': 6000
        };
        return {
          distanceMeters: score[key] ?? 5000,
          durationSeconds: 1000,
          polyline: [input.from, input.to]
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.status).toBe('routing_ready');
    expect(response.routingStatus).toBe('ready');
    expect(response.routePlan).toHaveLength(3);
    expect(response.routePlan?.[0]?.segments?.[0]?.to?.providerId).toBe('wp-a');
  });
});

describe('ROUT-04 integration: multiday payload includes explicit day boundary fields', () => {
  it('should expose startPoint/endPoint/overnightStopPoint in routePlan days', async () => {
    const provider: MapProvider = {
      async geocodePoint(input) {
        const dict: Record<string, { id: string; lng: number; lat: number }> = {
          北京: { id: 'origin', lng: 116.4, lat: 39.9 },
          途经A: { id: 'wp-b', lng: 116.6, lat: 39.92 },
          途经B: { id: 'wp-a', lng: 116.5, lat: 39.91 },
          杭州: { id: 'destination', lng: 120.2, lat: 30.25 }
        };
        const item = dict[input.query];
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: item.id,
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
          distanceMeters: 2000,
          durationSeconds: 1000,
          polyline: [input.from, input.to]
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.routePlan).toHaveLength(3);
    expect(response.routePlan?.[0]?.startPoint?.providerId).toBe('origin');
    expect(response.routePlan?.[0]?.endPoint?.providerId).toBe('wp-a');
    expect(response.routePlan?.[0]?.overnightStopPoint?.providerId).toBe('wp-a');
    expect(response.routePlan?.[1]?.startPoint?.providerId).toBe('wp-a');
    expect(response.routePlan?.[1]?.endPoint?.providerId).toBe('wp-b');
    expect(response.routePlan?.[1]?.overnightStopPoint?.providerId).toBe('wp-b');
    expect(response.routePlan?.[2]?.startPoint?.providerId).toBe('wp-b');
    expect(response.routePlan?.[2]?.endPoint?.providerId).toBe('destination');
    expect(response.routePlan?.[2]?.overnightStopPoint).toBeNull();
  });
});
