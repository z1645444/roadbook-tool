import { describe, expect, it } from 'vitest';

import type { LodgingCategory, LodgingSearchInput, MapProvider } from '../../src/map-provider/map-provider.port';
import { LodgingPolicyService } from '../../src/routing/lodging-policy.service';

const anchor = {
  providerId: 'day-stop-1',
  lng: 120.1,
  lat: 30.2
};

const buildCandidate = (
  providerId: string,
  category: LodgingCategory,
  distanceMeters: number,
  rating: number | null,
  priceCny: number | null
) => ({
  providerId,
  name: providerId,
  type: category,
  distanceMeters,
  rating,
  priceCny,
  policyStage: 'strict' as const
});

const baseResponses = {
  hostel: {
    8000: [
      buildCandidate('hostel-ok-2', 'hostel', 900, 4.2, 90),
      buildCandidate('hostel-drop-low-rating', 'hostel', 100, 3.9, 80),
      buildCandidate('hostel-ok-1', 'hostel', 400, 4.5, 95),
      buildCandidate('hostel-drop-too-low', 'hostel', 500, 4.4, 35),
      buildCandidate('hostel-ok-3', 'hostel', 1000, 4.0, 100)
    ],
    12000: [],
    20000: []
  },
  guesthouse: {
    8000: [
      buildCandidate('guesthouse-ok-2', 'guesthouse', 700, 4.6, 160),
      buildCandidate('guesthouse-ok-1', 'guesthouse', 600, 4.6, 150),
      buildCandidate('guesthouse-drop-too-expensive', 'guesthouse', 100, 4.8, 260)
    ],
    12000: [],
    20000: []
  },
  hotel: {
    8000: [
      buildCandidate('hotel-ok-3', 'hotel', 700, 4.3, 190),
      buildCandidate('hotel-ok-2', 'hotel', 500, 4.1, 160),
      buildCandidate('hotel-ok-1', 'hotel', 500, 4.1, 150),
      buildCandidate('hotel-drop-too-expensive', 'hotel', 100, 4.9, 260)
    ],
    12000: [],
    20000: []
  }
};

const buildProvider = (
  overrides?: Partial<
    Record<LodgingCategory, Partial<Record<8000 | 12000 | 20000, ReturnType<typeof buildCandidate>[]>>>
  >
) => {
  const calls: Array<{ category: LodgingCategory; radiusMeters: number }> = [];

  const provider: MapProvider = {
    async geocodePoint() {
      throw new Error('not used in lodging policy tests');
    },
    async routeBicyclingSegment() {
      throw new Error('not used in lodging policy tests');
    },
    async searchLodgingAround(input: LodgingSearchInput) {
      calls.push({ category: input.category, radiusMeters: input.radiusMeters });
      const categoryConfig = overrides?.[input.category] ?? {};
      const fromOverride = categoryConfig[input.radiusMeters as 8000 | 12000 | 20000];
      const fromBase =
        baseResponses[input.category][input.radiusMeters as 8000 | 12000 | 20000] ?? [];
      return {
        candidates: fromOverride ?? fromBase
      };
    }
  };

  return { provider, calls };
};

describe('LodgingPolicyService', () => {
  it('LODG-02 strict hostel filter should enforce threshold and top-3 cap', async () => {
    const { provider } = buildProvider();
    const service = new LodgingPolicyService(provider);

    const result = await service.buildLodgingRecommendations({
      sessionId: 's-1',
      dayIndex: 1,
      anchor
    });

    expect(result.policyStatus).toBe('compliant');
    expect(result.categories.hostel.map((item) => item.providerId)).toEqual([
      'hostel-ok-1',
      'hostel-ok-2',
      'hostel-ok-3'
    ]);
    expect(result.categories.hostel).toHaveLength(3);
  });

  it('LODG-03 strict guesthouse filter should enforce cap and ranking', async () => {
    const { provider } = buildProvider();
    const service = new LodgingPolicyService(provider);

    const result = await service.buildLodgingRecommendations({
      sessionId: 's-2',
      dayIndex: 2,
      anchor
    });

    expect(result.categories.guesthouse.map((item) => item.providerId)).toEqual([
      'guesthouse-ok-1',
      'guesthouse-ok-2'
    ]);
    expect(result.categories.guesthouse.every((item) => (item.priceCny ?? 0) <= 200)).toBe(true);
  });

  it('LODG-04 strict hotel filter should sort by distance asc, rating desc, price asc', async () => {
    const { provider } = buildProvider();
    const service = new LodgingPolicyService(provider);

    const result = await service.buildLodgingRecommendations({
      sessionId: 's-3',
      dayIndex: 3,
      anchor
    });

    expect(result.categories.hotel.map((item) => item.providerId)).toEqual([
      'hotel-ok-1',
      'hotel-ok-2',
      'hotel-ok-3'
    ]);
  });

  it('LODG-05 fallback sequence should reach no_match after strict_8km -> radius_12km -> radius_20km -> price_relaxed_20', async () => {
    const { provider, calls } = buildProvider({
      hostel: { 8000: [], 12000: [], 20000: [] },
      guesthouse: { 8000: [], 12000: [], 20000: [] },
      hotel: { 8000: [], 12000: [], 20000: [] }
    });
    const service = new LodgingPolicyService(provider);

    const result = await service.buildLodgingRecommendations({
      sessionId: 's-4',
      dayIndex: 4,
      anchor
    });

    expect(result.policyStatus).toBe('no_match');
    expect(result.fallbackTrace).toEqual([
      'strict_8km',
      'radius_12km',
      'radius_20km',
      'price_relaxed_20'
    ]);
    expect(calls).toHaveLength(12);
  });
});

