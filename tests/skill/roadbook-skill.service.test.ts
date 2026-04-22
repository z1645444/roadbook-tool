import { describe, expect, it } from 'vitest';

import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import type { ConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import type { RoutingOrchestratorResult } from '../../src/routing/routing-orchestrator.service';
import type { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';
import { RoadbookSkillService } from '../../src/skill/roadbook-skill.service';

describe('RoadbookSkillService', () => {
  const buildDraft = () => {
    const draft = createConstraintDraft('draft-1', 'session-1');
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
    return draft;
  };

  it('returns ready with markdown when orchestrator succeeds', async () => {
    const createdDrafts: Array<{ sessionId: string }> = [];
    const repository: ConstraintDraftRepository = {
      async createDraft(sessionId, initialDraft) {
        createdDrafts.push({ sessionId });
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

    const routeMetadata = {
      generatedAtIso: '2026-04-22T00:00:00.000Z',
      provider: 'amap',
      endpoint: '/v4/direction/bicycling',
      requestFingerprint: 'fp-1',
      responseHash: 'hash-1'
    };
    const orchestratorResult: RoutingOrchestratorResult = {
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
          segments: [
            {
              from: {
                provider: 'amap',
                providerId: 'origin-id',
                name: '北京',
                lng: 116.4,
                lat: 39.9,
                confidence: 0.99
              },
              to: {
                provider: 'amap',
                providerId: 'destination-id',
                name: '杭州',
                lng: 120.2,
                lat: 30.25,
                confidence: 0.99
              },
              distanceMeters: 1000,
              durationSeconds: 300,
              polyline: []
            }
          ],
          totalDistanceMeters: 1000,
          totalDurationSeconds: 300,
          lodging: null
        }
      ],
      fallbackMessage: null,
      routeMetadata,
      clarification: { needed: false }
    };
    const orchestrator = {
      async planRouteForSession() {
        return orchestratorResult;
      }
    } as unknown as RoutingOrchestratorService;

    const service = new RoadbookSkillService(orchestrator, repository);
    const output = await service.execute({
      sessionId: 'session-1',
      canonicalDraft: buildDraft(),
      recap: {
        summary: 'summary',
        assumptions: ['assumption-1']
      }
    });

    expect(createdDrafts).toHaveLength(1);
    expect(output.status).toBe('ready');
    if (output.status === 'ready') {
      expect(output.routePlan).toHaveLength(1);
      expect(output.roadbookMarkdown).toContain('## Day 1');
      expect(output.routeMetadata.requestFingerprint).toBe('fp-1');
    }
  });

  it('returns needs_clarification with prompt and slot', async () => {
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
          routingStatus: 'needs_clarification',
          routePlan: null,
          fallbackMessage: null,
          routeMetadata: null,
          clarification: {
            needed: true,
            slot: 'origin',
            candidateCount: 2,
            prompt: '请确认起点'
          }
        } as RoutingOrchestratorResult;
      }
    } as unknown as RoutingOrchestratorService;

    const service = new RoadbookSkillService(orchestrator, repository);
    const output = await service.execute({
      sessionId: 'session-clarify',
      canonicalDraft: buildDraft(),
      recap: {
        summary: 'summary',
        assumptions: []
      }
    });

    expect(output.status).toBe('needs_clarification');
    if (output.status === 'needs_clarification') {
      expect(output.clarification.slot).toBe('origin');
      expect(output.clarification.prompt).toContain('确认');
    }
  });

  it('returns fallback with user-safe fallback message', async () => {
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
          routingStatus: 'fallback',
          routePlan: null,
          fallbackMessage: '地图服务暂不可用，请稍后重试。',
          routeMetadata: null,
          clarification: { needed: false }
        } as RoutingOrchestratorResult;
      }
    } as unknown as RoutingOrchestratorService;

    const service = new RoadbookSkillService(orchestrator, repository);
    const output = await service.execute({
      sessionId: 'session-fallback',
      canonicalDraft: buildDraft(),
      recap: {
        summary: 'summary',
        assumptions: []
      }
    });

    expect(output.status).toBe('fallback');
    if (output.status === 'fallback') {
      expect(output.fallbackMessage).toContain('稍后重试');
      expect(output.roadbookMarkdown).toBeNull();
    }
  });
});
