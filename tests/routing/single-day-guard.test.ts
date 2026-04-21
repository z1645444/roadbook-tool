import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import type { MapProvider } from '../../src/map-provider/map-provider.port';
import { RoutingFallbackError } from '../../src/reliability/routing-fallback.error';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';

const buildRepositoryWithSingleDayDraft = async () => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-routing-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );

  const draft = createConstraintDraft('draft-route-1', 'session-route-1');
  draft.slots.origin = {
    raw: '北京',
    status: 'accepted',
    normalized: {
      provider: 'amap',
      providerId: 'origin-1',
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
      providerId: 'dest-1',
      name: '杭州',
      lng: 120.2,
      lat: 30.25,
      confidence: 0.99
    }
  };
  draft.slots.tripDays = {
    raw: '1',
    normalized: 1
  };
  draft.slots.waypoints = [];

  await repository.createDraft(draft.sessionId, draft);
  return repository;
};

describe('ROUT-05 single-day routing orchestrator guard', () => {
  it('should return exactly one route day when tripDays.normalized === 1', async () => {
    const repository = await buildRepositoryWithSingleDayDraft();
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
          distanceMeters: 12345,
          durationSeconds: 3333,
          polyline: [
            { lng: 116.4, lat: 39.9 },
            { lng: 120.2, lat: 30.25 }
          ]
        };
      }
    };

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-route-1');

    expect(result.routingStatus).toBe('ready');
    expect(result.routePlan).not.toBeNull();
    expect(result.routePlan).toHaveLength(1);
    expect(result.routePlan?.[0].dayIndex).toBe(1);
    expect(result.routePlan?.[0].startPoint?.providerId).toContain('北京');
    expect(result.routePlan?.[0].endPoint?.providerId).toContain('杭州');
    expect(result.routePlan?.[0].overnightStopPoint).toBeNull();
  });

  it('should block routing with clarification when geocode candidates are ambiguous', async () => {
    const repository = await buildRepositoryWithSingleDayDraft();
    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-a`,
              name: input.query,
              lng: 116.4,
              lat: 39.9,
              confidence: 0.99
            },
            {
              provider: 'amap',
              providerId: `${input.query}-b`,
              name: `${input.query} 备选`,
              lng: 116.5,
              lat: 39.95,
              confidence: 0.98
            }
          ]
        };
      },
      async routeBicyclingSegment() {
        return {
          distanceMeters: 1,
          durationSeconds: 1,
          polyline: []
        };
      }
    };

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-route-1');

    expect(result.routingStatus).toBe('needs_clarification');
    expect(result.routePlan).toBeNull();
    expect(result.clarification.needed).toBe(true);
  });

  it('should return deterministic RELY-01-safe fallback when provider throws fallback error', async () => {
    const repository = await buildRepositoryWithSingleDayDraft();
    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-ok`,
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
          category: 'rate_limited',
          userMessage: '地图服务请求过于频繁，请稍后重试。',
          retryable: true
        });
      }
    };

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-route-1');

    expect(result.routingStatus).toBe('fallback');
    expect(result.routePlan).toBeNull();
    expect(result.fallbackMessage).toContain('请稍后重试');
  });
});
