import { describe, expect, it } from 'vitest';

import type { GeocodeCandidate, MapProvider } from '../../src/map-provider/map-provider.port';
import { evaluatePointResolution } from '../../src/conversation/slot-resolver.service';

const createStubProvider = (candidates: GeocodeCandidate[]): MapProvider => ({
  async geocodePoint() {
    return { candidates };
  },
  async routeBicyclingSegment() {
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      polyline: []
    };
  }
});

describe('ROUT-01 geocode disambiguation and clarification contract', () => {
  it('should keep blocking clarification when geocode returns multiple candidates', async () => {
    const provider = createStubProvider([
      {
        provider: 'amap',
        providerId: 'p1',
        name: '人民广场 A',
        lng: 121.47,
        lat: 31.23,
        confidence: 0.99
      },
      {
        provider: 'amap',
        providerId: 'p2',
        name: '人民广场 B',
        lng: 121.48,
        lat: 31.24,
        confidence: 0.98
      }
    ]);

    const geocode = await provider.geocodePoint({ query: '人民广场' });
    const decision = evaluatePointResolution({
      slot: 'waypoint',
      confidence: Math.max(...geocode.candidates.map((item) => item.confidence)),
      candidateCount: geocode.candidates.length
    });

    expect(geocode.candidates).toHaveLength(2);
    expect(decision.clarificationNeeded).toBe(true);
    expect(decision.ambiguous).toBe(true);
    expect(decision.accepted).toBe(false);
  });

  it('should accept a single high-confidence candidate as resolved canonical point', async () => {
    const provider = createStubProvider([
      {
        provider: 'amap',
        providerId: 'hangzhou-west-lake',
        name: '杭州西湖',
        lng: 120.153,
        lat: 30.258,
        confidence: 0.97
      }
    ]);

    const geocode = await provider.geocodePoint({ query: '杭州西湖' });
    const decision = evaluatePointResolution({
      slot: 'origin',
      confidence: geocode.candidates[0].confidence,
      candidateCount: geocode.candidates.length
    });

    expect(geocode.candidates).toHaveLength(1);
    expect(geocode.candidates[0].providerId).toBe('hangzhou-west-lake');
    expect(decision.clarificationNeeded).toBe(false);
    expect(decision.accepted).toBe(true);
  });
});
