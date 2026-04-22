import { describe, expect, it } from 'vitest';

import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import type { ConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import type { RoutingOrchestratorResult } from '../../src/routing/routing-orchestrator.service';
import type { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';
import { createRoadbookAgentTool } from '../../src/skill/roadbook-skill.agent-tool';

describe('roadbook agent tool', () => {
  it('returns normalized tool payload for ready status', async () => {
    const repository: ConstraintDraftRepository = {
      async createDraft(_sessionId, initialDraft) {
        return initialDraft;
      },
      async getBySessionId() {
        return null;
      },
      async updateDraft() {
        throw new Error('not used');
      },
      async appendRevision() {
        throw new Error('not used');
      }
    };

    const orchestrator = {
      async planRouteForSession() {
        return {
          routingStatus: 'ready',
          routePlan: [
            {
              dayIndex: 1,
              startPoint: {
                provider: 'amap',
                providerId: 'origin-id',
                name: '北京',
                lng: 116.4,
                lat: 39.9,
                confidence: 0.99
              },
              endPoint: {
                provider: 'amap',
                providerId: 'destination-id',
                name: '杭州',
                lng: 120.2,
                lat: 30.25,
                confidence: 0.99
              },
              overnightStopPoint: null,
              segments: [],
              totalDistanceMeters: 0,
              totalDurationSeconds: 0,
              lodging: null
            }
          ],
          fallbackMessage: null,
          routeMetadata: {
            generatedAtIso: '2026-04-22T00:00:00.000Z',
            provider: 'amap',
            endpoint: '/v4/direction/bicycling',
            requestFingerprint: 'fp-ready',
            responseHash: 'hash-ready'
          },
          clarification: {
            needed: false
          }
        } as RoutingOrchestratorResult;
      }
    } as unknown as RoutingOrchestratorService;

    const tool = createRoadbookAgentTool({
      routingOrchestrator: orchestrator,
      draftRepository: repository
    });

    const draft = createConstraintDraft('draft-agent-ready', 'session-agent-ready');
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

    const response = await tool.run({
      sessionId: 'session-agent-ready',
      canonicalDraft: draft,
      recap: {
        summary: 'ready summary',
        assumptions: []
      }
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe('ready');
    expect(response.data.status).toBe('ready');
    if (response.data.status === 'ready') {
      expect(response.data.roadbookMarkdown).toContain('## Day 1');
      expect(response.data.routeMetadata.requestFingerprint).toBe('fp-ready');
    }
  });
});

