import { describe, expect, it } from 'vitest';

import { splitRouteIntoDayStages } from '../../src/routing/day-stage-splitter.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import type { OrderedRouteSegment } from '../../src/routing/segment-routing.service';
import type { GeocodeCandidate } from '../../src/map-provider/map-provider.port';

const point = (providerId: string, lng: number, lat: number): GeocodeCandidate => ({
  provider: 'amap',
  providerId,
  name: providerId,
  lng,
  lat,
  confidence: 0.99
});

const segment = (
  from: GeocodeCandidate,
  to: GeocodeCandidate,
  durationSeconds: number,
  distanceMeters = 1000
): OrderedRouteSegment => ({
  from,
  to,
  durationSeconds,
  distanceMeters,
  polyline: [
    { lng: from.lng, lat: from.lat },
    { lng: to.lng, lat: to.lat }
  ]
});

describe('ROUT-04 day-stage split', () => {
  it('should enforce ride-window and intensity cap with explicit day boundary fields', () => {
    const origin = point('origin', 116.4, 39.9);
    const wp1 = point('wp1', 116.5, 39.91);
    const wp2 = point('wp2', 116.6, 39.92);
    const destination = point('destination', 120.2, 30.25);

    const segments: OrderedRouteSegment[] = [
      segment(origin, wp1, 1200),
      segment(wp1, wp2, 1200),
      segment(wp2, destination, 1200)
    ];

    const draft = createConstraintDraft('d-1', 's-1');
    draft.slots.intensity = { raw: 'easy', normalized: 'easy' };
    draft.slots.rideWindow = {
      raw: '08:00-08:45',
      normalized: { start: '08:00', end: '08:45', minutes: 45 }
    };

    const days = splitRouteIntoDayStages(segments, draft, [origin, wp1, wp2, destination]);

    expect(days).toHaveLength(2);
    expect(days[0].dayIndex).toBe(1);
    expect(days[0].startPoint.providerId).toBe('origin');
    expect(days[0].endPoint.providerId).toBe('wp2');
    expect(days[0].overnightStopPoint?.providerId).toBe('wp2');
    expect(days[1].dayIndex).toBe(2);
    expect(days[1].startPoint.providerId).toBe('wp2');
    expect(days[1].endPoint.providerId).toBe('destination');
    expect(days[1].overnightStopPoint).toBeNull();
  });
});
