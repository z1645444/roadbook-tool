import { describe, expect, it } from 'vitest';

import type { GeocodeCandidate, MapProvider } from '../../src/map-provider/map-provider.port';
import {
  buildOrderedSegments,
  summarizeRouteSegments,
  type OrderedRouteSegment
} from '../../src/routing/segment-routing.service';

const points: GeocodeCandidate[] = [
  {
    provider: 'amap',
    providerId: 'p0',
    name: 'P0',
    lng: 120.1,
    lat: 30.2,
    confidence: 0.99
  },
  {
    provider: 'amap',
    providerId: 'p1',
    name: 'P1',
    lng: 120.2,
    lat: 30.3,
    confidence: 0.99
  },
  {
    provider: 'amap',
    providerId: 'p2',
    name: 'P2',
    lng: 120.3,
    lat: 30.4,
    confidence: 0.99
  }
];

const provider: Pick<MapProvider, 'routeBicyclingSegment'> = {
  async routeBicyclingSegment(input) {
    if (input.from.lng === 120.1 && input.to.lng === 120.2) {
      return {
        distanceMeters: 1000,
        durationSeconds: 200,
        polyline: [
          { lng: 120.1, lat: 30.2 },
          { lng: 120.2, lat: 30.3 }
        ]
      };
    }

    return {
      distanceMeters: 1500,
      durationSeconds: 300,
      polyline: [
        { lng: 120.2, lat: 30.3 },
        { lng: 120.3, lat: 30.4 }
      ]
    };
  }
};

describe('ROUT-02 bicycling ordered segments and deterministic totals', () => {
  it('should build segments in strict ordered-point sequence P0->P1 then P1->P2', async () => {
    const result = await buildOrderedSegments(points, provider);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].from.name).toBe('P0');
    expect(result.segments[0].to.name).toBe('P1');
    expect(result.segments[1].from.name).toBe('P1');
    expect(result.segments[1].to.name).toBe('P2');
  });

  it('should compute deterministic totalDistance and totalDuration from segment metrics', () => {
    const segments: OrderedRouteSegment[] = [
      {
        from: points[0],
        to: points[1],
        distanceMeters: 1200,
        durationSeconds: 210,
        polyline: [
          { lng: 120.1, lat: 30.2 },
          { lng: 120.2, lat: 30.3 }
        ]
      },
      {
        from: points[1],
        to: points[2],
        distanceMeters: 1800,
        durationSeconds: 360,
        polyline: [
          { lng: 120.2, lat: 30.3 },
          { lng: 120.3, lat: 30.4 }
        ]
      }
    ];

    const summary = summarizeRouteSegments(segments);

    expect(summary.totalDistanceMeters).toBe(3000);
    expect(summary.totalDurationSeconds).toBe(570);
  });
});
