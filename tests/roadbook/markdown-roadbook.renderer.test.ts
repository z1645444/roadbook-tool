import { describe, expect, it } from 'vitest';

import { renderMarkdownRoadbook } from '../../src/roadbook/markdown-roadbook.renderer';
import type { RoadbookRenderInput } from '../../src/roadbook/roadbook-render.types';

const buildInput = (): RoadbookRenderInput => ({
  recap: {
    summary: 'Origin: 北京 | Destination: 杭州 | Trip days: 2',
    assumptions: ['waypoint assumption: use district center']
  },
  routeMetadata: {
    generatedAtIso: '2026-04-22T09:30:00+08:00',
    provider: 'amap',
    endpoint: '/v4/direction/bicycling',
    requestFingerprint: 'req-fingerprint',
    responseHash: 'resp-hash',
    infocode: '10000'
  },
  options: {
    title: '浙江骑行路书',
    includeValidationContext: true
  },
  routePlan: [
    {
      dayIndex: 2,
      startPoint: {
        providerId: 'wp1',
        name: '苏州',
        lng: 120.58,
        lat: 31.3
      },
      endPoint: {
        providerId: 'dest',
        name: '杭州',
        lng: 120.2,
        lat: 30.25
      },
      overnightStopPoint: null,
      totalDistanceMeters: 10000,
      totalDurationSeconds: 3600,
      segments: [
        {
          from: {
            providerId: 'wp1',
            name: '苏州',
            lng: 120.58,
            lat: 31.3
          },
          to: {
            providerId: 'dest',
            name: '杭州',
            lng: 120.2,
            lat: 30.25
          },
          distanceMeters: 10000,
          durationSeconds: 3600,
          polyline: [
            { lng: 120.58, lat: 31.3 },
            { lng: 120.2, lat: 30.25 }
          ]
        }
      ],
      lodging: null
    },
    {
      dayIndex: 1,
      startPoint: {
        providerId: 'origin',
        name: '北京',
        lng: 116.4,
        lat: 39.9
      },
      endPoint: {
        providerId: 'wp1',
        name: '苏州',
        lng: 120.58,
        lat: 31.3
      },
      overnightStopPoint: {
        providerId: 'wp1',
        name: '苏州',
        lng: 120.58,
        lat: 31.3
      },
      totalDistanceMeters: 125000,
      totalDurationSeconds: 18000,
      segments: [
        {
          from: {
            providerId: 'origin',
            name: '北京',
            lng: 116.4,
            lat: 39.9
          },
          to: {
            providerId: 'wp1',
            name: '苏州',
            lng: 120.58,
            lat: 31.3
          },
          distanceMeters: 125000,
          durationSeconds: 18000,
          polyline: [
            { lng: 116.4, lat: 39.9 },
            { lng: 120.58, lat: 31.3 }
          ]
        }
      ],
      lodging: {
        policyStatus: 'no_match',
        fallbackTrace: ['strict_8km', 'radius_12km'],
        categories: {
          hostel: [],
          guesthouse: [],
          hotel: []
        }
      }
    }
  ]
});

describe('BOOK-01 markdown roadbook renderer', () => {
  it('BOOK-01 should render day-grouped sections in ascending day order', () => {
    const output = renderMarkdownRoadbook(buildInput());

    const day1Index = output.indexOf('## Day 1');
    const day2Index = output.indexOf('## Day 2');
    expect(day1Index).toBeGreaterThan(-1);
    expect(day2Index).toBeGreaterThan(-1);
    expect(day1Index).toBeLessThan(day2Index);
  });

  it('BOOK-02 should include route overview distance time and waypoint sequence per day', () => {
    const output = renderMarkdownRoadbook(buildInput());

    expect(output).toContain('Route: 北京 -> 苏州');
    expect(output).toContain('Distance: 125.0 km');
    expect(output).toContain('Estimated Ride Time: 5.0 h');
    expect(output).toContain('Waypoints: 北京 → 苏州');
  });
});

describe('BOOK-04 markdown validation sections', () => {
  it('BOOK-04 should include constraint summary assumptions and metadata context', () => {
    const output = renderMarkdownRoadbook(buildInput());

    expect(output).toContain('## 约束摘要');
    expect(output).toContain('Origin: 北京');
    expect(output).toContain('## 假设与修正');
    expect(output).toContain('waypoint assumption: use district center');
    expect(output).toContain('修正路径');
    expect(output).toContain('## 校验上下文');
    expect(output).toContain('requestFingerprint: req\\-fingerprint');
    expect(output).toContain('responseHash: resp\\-hash');
  });

  it('BOOK-04 should include no_match fallback trace wording for lodging explainability', () => {
    const output = renderMarkdownRoadbook(buildInput());

    expect(output).toContain('当前日未找到满足筛选条件的住宿候选。');
    expect(output).toContain('Fallback Trace: strict\\_8km -> radius\\_12km');
  });
});
