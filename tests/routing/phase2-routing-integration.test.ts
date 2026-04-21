import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { IntakeController } from '../../src/conversation/intake.controller';
import type { MapProvider } from '../../src/map-provider/map-provider.port';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';
import { RoutingFallbackError } from '../../src/reliability/routing-fallback.error';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';

const createHarness = async (provider: MapProvider) => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-phase2-e2e-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );
  const orchestrator = new RoutingOrchestratorService(provider, repository);
  const controller = new IntakeController(orchestrator, repository);
  return { controller };
};

const basePayload = {
  sessionId: 'phase2-session',
  turnId: 'phase2-turn',
  message: 'phase2 integration',
  proposedSlots: [
    { key: 'origin', value: '北京', confidence: 0.99 },
    { key: 'destination', value: '杭州', confidence: 0.99 },
    { key: 'tripDays', value: '1', confidence: 1 },
    { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
    { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
    { key: 'intensity', value: 'standard', confidence: 1 }
  ]
} as const;

describe('ROUT-01 integration: ambiguous geocode blocks route generation', () => {
  it('should return clarification state and skip route generation for ambiguous points', async () => {
    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-1`,
              name: input.query,
              lng: 120.1,
              lat: 30.1,
              confidence: 0.99
            },
            {
              provider: 'amap',
              providerId: `${input.query}-2`,
              name: `${input.query}候选`,
              lng: 120.2,
              lat: 30.2,
              confidence: 0.98
            }
          ]
        };
      },
      async routeBicyclingSegment() {
        return {
          distanceMeters: 10,
          durationSeconds: 10,
          polyline: []
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.routingStatus).toBe('needs_clarification');
    expect(response.status).toBe('need_clarification');
    expect(response.routePlan).toBeNull();
  });
});

describe('ROUT-02 integration: ordered points produce deterministic segment order', () => {
  it('should build route segments in deterministic P0->P1 order for a confirmed trip', async () => {
    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-only`,
              name: input.query,
              lng: input.query === '北京' ? 116.4 : 120.2,
              lat: input.query === '北京' ? 39.9 : 30.25,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment(input) {
        const isFirstLeg = input.from.lng === 116.4 && input.to.lng === 120.2;
        return {
          distanceMeters: isFirstLeg ? 1500 : 2500,
          durationSeconds: isFirstLeg ? 400 : 600,
          polyline: [input.from, input.to]
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.routingStatus).toBe('ready');
    expect(response.routePlan?.[0]?.segments?.[0]?.from?.providerId).toContain('北京');
    expect(response.routePlan?.[0]?.segments?.[0]?.to?.providerId).toContain('杭州');
  });
});

describe('ROUT-05 integration: one-day trip keeps one-day artifact', () => {
  it('should keep exactly one day in routePlan for tripDays=1', async () => {
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
          distanceMeters: 1111,
          durationSeconds: 222,
          polyline: [input.from, input.to]
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.status).toBe('routing_ready');
    expect(response.routePlan).toHaveLength(1);
    expect(response.routePlan?.[0]?.dayIndex).toBe(1);
  });
});

describe('RELY-01 integration: provider failures map to fallback response', () => {
  it('should return mapped fallback message and category-safe status on provider errors', async () => {
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
        throw new RoutingFallbackError({
          category: 'quota_error',
          userMessage: '地图服务配额不足，请稍后再试。',
          retryable: false
        });
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.routingStatus).toBe('fallback');
    expect(response.status).toBe('routing_fallback');
    expect(response.fallbackMessage).toContain('配额不足');
  });
});

describe('RELY-03 integration: route metadata includes reproducibility fields', () => {
  it('should expose generatedAtIso/provider/requestFingerprint/responseHash in routeMetadata', async () => {
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
          distanceMeters: 1234,
          durationSeconds: 321,
          polyline: [input.from, input.to]
        };
      }
    };

    const { controller } = await createHarness(provider);
    const response = await controller.processTurn(basePayload);

    expect(response.routingStatus).toBe('ready');
    expect(response.routeMetadata).toMatchObject({
      provider: 'amap',
      requestFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
      responseHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect((response.routeMetadata as { generatedAtIso: string }).generatedAtIso).toBeTruthy();
  });
});
