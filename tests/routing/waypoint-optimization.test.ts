import { describe, expect, it } from 'vitest';

import type { GeocodeCandidate, MapProvider } from '../../src/map-provider/map-provider.port';
import { optimizeWaypointSequence } from '../../src/routing/waypoint-optimizer.service';

const point = (providerId: string, lng: number, lat: number): GeocodeCandidate => ({
  provider: 'amap',
  providerId,
  name: providerId,
  lng,
  lat,
  confidence: 0.99
});

describe('ROUT-03 deterministic waypoint optimization', () => {
  it('should be deterministic across repeated runs and preserves start/end points', async () => {
    const points = [
      point('origin', 116.4, 39.9),
      point('wp-c', 116.5, 39.91),
      point('wp-a', 116.6, 39.92),
      point('wp-b', 116.7, 39.93),
      point('destination', 120.2, 30.25)
    ];

    const legScore: Record<string, { distanceMeters: number; durationSeconds: number }> = {
      'origin->wp-a': { distanceMeters: 8, durationSeconds: 8 },
      'origin->wp-b': { distanceMeters: 20, durationSeconds: 20 },
      'origin->wp-c': { distanceMeters: 20, durationSeconds: 20 },
      'wp-a->wp-b': { distanceMeters: 6, durationSeconds: 6 },
      'wp-a->wp-c': { distanceMeters: 25, durationSeconds: 25 },
      'wp-a->destination': { distanceMeters: 40, durationSeconds: 40 },
      'wp-b->wp-a': { distanceMeters: 6, durationSeconds: 6 },
      'wp-b->wp-c': { distanceMeters: 7, durationSeconds: 7 },
      'wp-b->destination': { distanceMeters: 10, durationSeconds: 10 },
      'wp-c->wp-a': { distanceMeters: 5, durationSeconds: 5 },
      'wp-c->wp-b': { distanceMeters: 7, durationSeconds: 7 },
      'wp-c->destination': { distanceMeters: 9, durationSeconds: 9 }
    };

    const provider: Pick<MapProvider, 'routeBicyclingSegment'> = {
      async routeBicyclingSegment({ from, to }) {
        const key = `${from.lng === 116.4 ? 'origin' : from.lng === 120.2 ? 'destination' : from.lng === 116.5 ? 'wp-c' : from.lng === 116.6 ? 'wp-a' : 'wp-b'}->${to.lng === 116.4 ? 'origin' : to.lng === 120.2 ? 'destination' : to.lng === 116.5 ? 'wp-c' : to.lng === 116.6 ? 'wp-a' : 'wp-b'}`;
        const found = legScore[key];
        if (!found) {
          throw new Error(`missing leg fixture for ${key}`);
        }
        return {
          ...found,
          polyline: [from, to]
        };
      }
    };

    const run1 = await optimizeWaypointSequence(points, provider);
    const run2 = await optimizeWaypointSequence(points, provider);

    expect(run1.optimizedPoints.map((item) => item.providerId)).toEqual([
      'origin',
      'wp-a',
      'wp-b',
      'wp-c',
      'destination'
    ]);
    expect(run2.optimizedPoints.map((item) => item.providerId)).toEqual(
      run1.optimizedPoints.map((item) => item.providerId)
    );
    expect(run1.optimizedPoints[0].providerId).toBe('origin');
    expect(run1.optimizedPoints.at(-1)?.providerId).toBe('destination');
  });

  it('should apply deterministic tie-break by lexical providerId when scores are equal', async () => {
    const points = [
      point('origin', 116.4, 39.9),
      point('wp-b', 116.5, 39.91),
      point('wp-a', 116.6, 39.92),
      point('destination', 120.2, 30.25)
    ];

    const provider: Pick<MapProvider, 'routeBicyclingSegment'> = {
      async routeBicyclingSegment({ from, to }) {
        return {
          distanceMeters: from.lng + to.lng,
          durationSeconds: from.lat + to.lat,
          polyline: [from, to]
        };
      }
    };

    const result = await optimizeWaypointSequence(points, provider);

    expect(result.optimizedPoints.map((item) => item.providerId)).toEqual([
      'origin',
      'wp-a',
      'wp-b',
      'destination'
    ]);
  });
});
