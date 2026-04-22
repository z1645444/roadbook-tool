import { describe, expect, it } from 'vitest';

import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { handleRoadbookSkillRpc } from '../../src/skill/roadbook-skill.rpc';

describe('roadbook skill rpc', () => {
  it('returns manifest on skill.describe', async () => {
    const response = await handleRoadbookSkillRpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'skill.describe'
    });

    expect(response).not.toBeNull();
    expect('result' in (response as object)).toBe(true);
    if (response && 'result' in response) {
      const result = response.result as { name: string; tool: { name: string } };
      expect(result.name).toBe('roadbook-skill');
      expect(result.tool.name).toBe('roadbook.plan');
    }
  });

  it('returns validation error on invalid skill.invoke payload', async () => {
    const response = await handleRoadbookSkillRpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'skill.invoke',
      params: {
        sessionId: '',
        canonicalDraft: {},
        recap: {}
      }
    });

    expect(response).not.toBeNull();
    expect('error' in (response as object)).toBe(true);
    if (response && 'error' in response) {
      expect(response.error.code).toBe(-32000);
      expect(response.error.message).toContain('sessionId');
    }
  });

  it('returns method not found for unknown method', async () => {
    const response = await handleRoadbookSkillRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'unknown.method'
    });

    expect(response).not.toBeNull();
    expect('error' in (response as object)).toBe(true);
    if (response && 'error' in response) {
      expect(response.error.code).toBe(-32601);
    }
  });

  it('invokes skill with valid payload when AMAP_API_KEY is available', async () => {
    const draft = createConstraintDraft('draft-rpc', 'session-rpc');
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

    const response = await handleRoadbookSkillRpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'skill.invoke',
      params: {
        sessionId: 'session-rpc',
        canonicalDraft: draft,
        recap: {
          summary: 'summary',
          assumptions: []
        }
      }
    }, {
      async invokeSkill() {
        return {
          ok: true,
          status: 'fallback',
          data: {
            status: 'fallback',
            routePlan: null,
            routeMetadata: null,
            roadbookMarkdown: null,
            fallbackMessage: '地图服务暂不可用，请稍后重试。',
            clarification: null
          }
        };
      }
    });

    expect(response).not.toBeNull();
    expect('result' in (response as object)).toBe(true);
    if (response && 'result' in response) {
      const result = response.result as { status: string; ok: boolean };
      expect(result.ok).toBe(true);
      expect(result.status).toBe('fallback');
    }
  });
});
