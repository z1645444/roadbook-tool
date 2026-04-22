import { describe, expect, it } from 'vitest';

import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { createMinimalRoadbookSkill } from '../../src/skill/minimal-roadbook-skill';

describe('minimal roadbook skill', () => {
  it('provides a hermes/openclaw-friendly run() surface', async () => {
    const skill = createMinimalRoadbookSkill(
      {
        amapApiKey: 'fake-key',
        storagePath: '.storage/constraint-drafts.minimal-test.json'
      },
      {
        draftRepository: {
          async createDraft(_sessionId, initialDraft) {
            return initialDraft;
          }
        },
        routingOrchestrator: {
          async planRouteForSession() {
            return {
              routingStatus: 'fallback',
              routePlan: null,
              fallbackMessage: '地图服务暂不可用，请稍后重试。',
              routeMetadata: null,
              clarification: { needed: false }
            };
          }
        }
      }
    );

    const draft = createConstraintDraft('draft-minimal', 'session-minimal');
    draft.slots.origin = {
      raw: '北京',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'origin-id',
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
        providerId: 'destination-id',
        name: '杭州',
        lng: 120.2,
        lat: 30.25,
        confidence: 0.99
      }
    };
    draft.slots.dateRange = {
      raw: '2026-05-01 to 2026-05-01',
      normalized: {
        startDate: '2026-05-01',
        endDate: '2026-05-01'
      }
    };
    draft.slots.tripDays = {
      raw: '1',
      normalized: 1
    };
    draft.slots.rideWindow = {
      raw: '08:00-17:00',
      normalized: {
        start: '08:00',
        end: '17:00',
        minutes: 540
      }
    };
    draft.slots.intensity = {
      raw: 'standard',
      normalized: 'standard'
    };

    const response = await skill.run({
      sessionId: 'session-minimal',
      canonicalDraft: draft,
      recap: {
        summary: 'summary',
        assumptions: []
      }
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe('fallback');
    expect(response.data.status).toBe('fallback');
  });
});

