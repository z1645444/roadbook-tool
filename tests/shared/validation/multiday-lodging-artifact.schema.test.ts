import { describe, expect, it } from 'vitest';

import { safeParseMultidayRouteArtifact } from '../../../src/shared/validation/multiday-route-artifact.schema';

const baseRoutePoint = {
  providerId: 'p-1',
  name: 'point',
  lng: 120.1,
  lat: 30.1
};

const baseSegment = {
  from: baseRoutePoint,
  to: {
    providerId: 'p-2',
    name: 'point-2',
    lng: 120.2,
    lat: 30.2
  },
  distanceMeters: 1000,
  durationSeconds: 300,
  polyline: [
    { lng: 120.1, lat: 30.1 },
    { lng: 120.2, lat: 30.2 }
  ]
};

describe('multiday lodging artifact schema', () => {
  it('should parse day-level lodging payload when shape is valid', () => {
    const parsed = safeParseMultidayRouteArtifact({
      optimizedPoints: [baseRoutePoint, baseSegment.to],
      days: [
        {
          dayIndex: 1,
          startPoint: baseRoutePoint,
          endPoint: baseSegment.to,
          overnightStopPoint: baseSegment.to,
          totalDistanceMeters: 1000,
          totalDurationSeconds: 300,
          segments: [baseSegment],
          lodging: {
            policyStatus: 'compliant',
            fallbackTrace: ['strict_8km'],
            categories: {
              hostel: [
                {
                  providerId: 'lodging-1',
                  name: 'hostel-a',
                  type: 'hostel',
                  distanceMeters: 500,
                  rating: 4.2,
                  priceCny: 80,
                  policyStage: 'strict'
                }
              ],
              guesthouse: [],
              hotel: []
            }
          }
        }
      ],
      totals: {
        totalDistanceMeters: 1000,
        totalDurationSeconds: 300
      }
    });

    expect(parsed.success).toBe(true);
  });

  it('should reject malformed lodging payload with category overflow and bad numbers', () => {
    const parsed = safeParseMultidayRouteArtifact({
      optimizedPoints: [baseRoutePoint, baseSegment.to],
      days: [
        {
          dayIndex: 1,
          startPoint: baseRoutePoint,
          endPoint: baseSegment.to,
          overnightStopPoint: baseSegment.to,
          totalDistanceMeters: 1000,
          totalDurationSeconds: 300,
          segments: [baseSegment],
          lodging: {
            policyStatus: 'compliant',
            fallbackTrace: ['strict_8km'],
            categories: {
              hostel: [
                {
                  providerId: 'lodging-1',
                  name: 'hostel-a',
                  type: 'hostel',
                  distanceMeters: 500,
                  rating: 4.2,
                  priceCny: 80,
                  policyStage: 'strict'
                },
                {
                  providerId: 'lodging-2',
                  name: 'hostel-b',
                  type: 'hostel',
                  distanceMeters: 600,
                  rating: 4.1,
                  priceCny: 90,
                  policyStage: 'strict'
                },
                {
                  providerId: 'lodging-3',
                  name: 'hostel-c',
                  type: 'hostel',
                  distanceMeters: 700,
                  rating: 4.0,
                  priceCny: 95,
                  policyStage: 'strict'
                },
                {
                  providerId: 'lodging-4',
                  name: 'hostel-d',
                  type: 'hostel',
                  distanceMeters: 800,
                  rating: 4.4,
                  priceCny: Number.NaN,
                  policyStage: 'strict'
                }
              ],
              guesthouse: [],
              hotel: []
            }
          }
        }
      ],
      totals: {
        totalDistanceMeters: 1000,
        totalDurationSeconds: 300
      }
    });

    expect(parsed.success).toBe(false);
  });
});
