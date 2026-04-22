import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import { IntakeController } from '../../src/conversation/intake.controller';
import type { MapProvider } from '../../src/map-provider/map-provider.port';
import { RoutingFallbackError } from '../../src/reliability/routing-fallback.error';
import { RoutingOrchestratorService } from '../../src/routing/routing-orchestrator.service';

const buildProvider = (): MapProvider => ({
  async geocodePoint(input) {
    if (input.query === 'ambiguous') {
      return {
        candidates: [
          {
            provider: 'amap',
            providerId: 'amb-1',
            name: '候选一',
            lng: 116.4,
            lat: 39.9,
            confidence: 0.9
          },
          {
            provider: 'amap',
            providerId: 'amb-2',
            name: '候选二',
            lng: 116.5,
            lat: 40.0,
            confidence: 0.88
          }
        ]
      };
    }

    return {
      candidates: [
        {
          provider: 'amap',
          providerId: `${input.query}-id`,
          name: input.query,
          lng: input.query === '北京' ? 116.4 : 120.2,
          lat: input.query === '北京' ? 39.9 : 30.25,
          confidence: 0.99
        }
      ]
    };
  },
  async routeBicyclingSegment(input) {
    return {
      distanceMeters: 3200,
      durationSeconds: 960,
      polyline: [input.from, input.to]
    };
  },
  async searchLodgingAround() {
    return {
      candidates: []
    };
  }
});

describe('intake skill delegation parity', () => {
  it('keeps routing_ready response shape after skill delegation', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-skill-parity-ready-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );
    const orchestrator = new RoutingOrchestratorService(buildProvider(), repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'skill-ready',
      turnId: 'turn-ready',
      message: 'ready',
      proposedSlots: [
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('routing_ready');
    expect(response.routingStatus).toBe('ready');
    expect(response.routePlan).not.toBeNull();
    expect(response.routeMetadata).not.toBeNull();
    expect(response.fallbackMessage).toBeNull();
    expect(response.roadbookMarkdown).toContain('## Day 1');
  });

  it('keeps need_clarification response shape after skill delegation', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-skill-parity-clarify-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );
    const orchestrator = new RoutingOrchestratorService(buildProvider(), repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'skill-clarify',
      turnId: 'turn-clarify',
      message: 'clarify',
      proposedSlots: [
        { key: 'origin', value: 'ambiguous', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('need_clarification');
    expect(response.routingStatus).toBe('needs_clarification');
    expect(response.missingSlots.length).toBeGreaterThan(0);
    expect(response.clarificationPrompt).toContain('确认');
    expect(response.routePlan).toBeNull();
    expect(response.roadbookMarkdown).toBeNull();
  });

  it('keeps routing_fallback response shape after skill delegation', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-skill-parity-fallback-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );
    const provider: MapProvider = {
      async geocodePoint(input) {
        return {
          candidates: [
            {
              provider: 'amap',
              providerId: `${input.query}-id`,
              name: input.query,
              lng: 116.4,
              lat: 39.9,
              confidence: 0.99
            }
          ]
        };
      },
      async routeBicyclingSegment() {
        throw new RoutingFallbackError({
          category: 'provider_unavailable',
          userMessage: '地图服务暂不可用，请稍后重试。',
          retryable: true
        });
      },
      async searchLodgingAround() {
        return { candidates: [] };
      }
    };
    const orchestrator = new RoutingOrchestratorService(provider, repository);
    const controller = new IntakeController(orchestrator, repository);

    const response = await controller.processTurn({
      sessionId: 'skill-fallback',
      turnId: 'turn-fallback',
      message: 'fallback',
      proposedSlots: [
        { key: 'origin', value: '北京', confidence: 0.99 },
        { key: 'destination', value: '杭州', confidence: 0.99 },
        { key: 'dateRange', value: '2026-05-01 to 2026-05-01', confidence: 1 },
        { key: 'tripDays', value: '1', confidence: 1 },
        { key: 'rideWindow', value: '08:00-17:00', confidence: 1 },
        { key: 'intensity', value: 'standard', confidence: 1 }
      ]
    });

    expect(response.status).toBe('routing_fallback');
    expect(response.routingStatus).toBe('fallback');
    expect(response.routePlan).toBeNull();
    expect(response.fallbackMessage).toContain('稍后重试');
    expect(response.roadbookMarkdown).toBeNull();
  });
});
