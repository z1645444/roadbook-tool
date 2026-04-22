import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import type { MapProvider, LodgingSearchInput } from '../../src/map-provider/map-provider.port';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';

const createRepository = async (sessionId: string, tripDays: number) => {
  const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-lodging-integration-'));
  const repository = new StorageBackedConstraintDraftRepository(
    join(storageDir, 'storage/constraint-drafts.json')
  );

  const draft = createConstraintDraft(`draft-${sessionId}`, sessionId);
  draft.slots.origin = {
    raw: '北京',
    status: 'accepted',
    normalized: {
      provider: 'amap',
      providerId: 'origin',
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
      providerId: 'destination',
      name: '杭州',
      lng: 120.2,
      lat: 30.25,
      confidence: 0.99
    }
  };
  draft.slots.tripDays = {
    raw: String(tripDays),
    normalized: tripDays
  };
  draft.slots.rideWindow = {
    raw: '08:00-08:20',
    normalized: {
      start: '08:00',
      end: '08:20',
      minutes: 20
    }
  };
  if (tripDays > 1) {
    draft.slots.waypoints = [
      {
        raw: '途经点',
        status: 'accepted',
        normalized: {
          provider: 'amap',
          providerId: 'waypoint',
          name: '途经点',
          lng: 116.9,
          lat: 39.95,
          confidence: 0.99
        }
      }
    ];
  }

  await repository.createDraft(sessionId, draft);
  return repository;
};

const buildProvider = (
  searchImpl: (input: LodgingSearchInput) => ReturnType<NonNullable<MapProvider['searchLodgingAround']>>
) => {
  const searchCalls: LodgingSearchInput[] = [];
  const provider: MapProvider = {
    async geocodePoint(input) {
      const geo: Record<string, { providerId: string; lng: number; lat: number }> = {
        北京: { providerId: 'origin', lng: 116.4, lat: 39.9 },
        杭州: { providerId: 'destination', lng: 120.2, lat: 30.25 },
        途经点: { providerId: 'waypoint', lng: 116.9, lat: 39.95 }
      };
      const point = geo[input.query];
      return {
        candidates: [
          {
            provider: 'amap',
            providerId: point.providerId,
            name: input.query,
            lng: point.lng,
            lat: point.lat,
            confidence: 0.99
          }
        ]
      };
    },
    async routeBicyclingSegment(input) {
      return {
        distanceMeters: 3000,
        durationSeconds: 1800,
        polyline: [input.from, input.to]
      };
    },
    async searchLodgingAround(input) {
      searchCalls.push(input);
      return searchImpl(input);
    }
  };

  return { provider, searchCalls };
};

describe('lodging integration', () => {
  it('LODG-01 should attach day-level lodging payload on multiday route only for days with overnightStopPoint', async () => {
    const repository = await createRepository('session-lodging-1', 2);
    const { provider, searchCalls } = buildProvider(async (input) => ({
      candidates: [
        {
          providerId: `${input.category}-a`,
          name: `${input.category}-a`,
          type: input.category,
          distanceMeters: 500,
          rating: 4.4,
          priceCny: input.category === 'hostel' ? 90 : 180,
          policyStage: 'strict'
        }
      ]
    }));

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-lodging-1');

    expect(result.routingStatus).toBe('ready');
    expect(result.routePlan).not.toBeNull();
    expect(result.routePlan?.[0]?.overnightStopPoint).not.toBeNull();
    expect(result.routePlan?.[0]?.lodging?.categories.hostel[0]?.providerId).toBe('hostel-a');
    expect(result.routePlan?.at(-1)?.overnightStopPoint).toBeNull();
    expect(result.routePlan?.at(-1)?.lodging).toBeNull();
    expect(searchCalls.length).toBeGreaterThan(0);
  });

  it('single-day route should keep lodging null and never call searchLodgingAround', async () => {
    const repository = await createRepository('session-lodging-2', 1);
    const { provider, searchCalls } = buildProvider(async () => ({
      candidates: []
    }));

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-lodging-2');

    expect(result.routingStatus).toBe('ready');
    expect(result.routePlan).toHaveLength(1);
    expect(result.routePlan?.[0]?.lodging).toBeNull();
    expect(searchCalls).toHaveLength(0);
  });

  it('BOOK-04 should keep no_match fallbackTrace deterministic for markdown explainability', async () => {
    const repository = await createRepository('session-lodging-3', 2);
    const { provider } = buildProvider(async () => ({
      candidates: []
    }));

    const service = new RoutingOrchestratorService(provider, repository);
    const result = await service.planRouteForSession('session-lodging-3');

    expect(result.routingStatus).toBe('ready');
    expect(result.routePlan?.[0]?.lodging?.policyStatus).toBe('no_match');
    expect(result.routePlan?.[0]?.lodging?.fallbackTrace).toContain('strict_8km');
  });
});
