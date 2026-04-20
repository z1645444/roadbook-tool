import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { applyConstraintPatch } from '../../src/constraints/constraint-patch.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import {
  buildConstraintRecap,
  buildConstraintRecapFromRepository,
  regenerateFullRecap
} from '../../src/recap/recap-projection.service';

const buildSampleDraft = () => {
  const draft = createConstraintDraft('draft-relay-02', 'session-relay-02');
  draft.slots.origin = {
    raw: '北京',
    status: 'accepted',
    normalized: {
      provider: 'amap',
      providerId: 'poi-a',
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
      providerId: 'poi-b',
      name: '杭州',
      lng: 120.2,
      lat: 30.25,
      confidence: 0.99
    }
  };
  draft.slots.waypoints = [
    {
      raw: '苏州',
      status: 'accepted',
      normalized: {
        provider: 'amap',
        providerId: 'poi-c',
        name: '苏州',
        lng: 120.6,
        lat: 31.3,
        confidence: 0.96
      }
    }
  ];
  draft.slots.dateRange = {
    raw: '2026-05-01 to 2026-05-03',
    normalized: {
      startDate: '2026-05-01',
      endDate: '2026-05-03'
    }
  };
  draft.slots.tripDays = {
    raw: '3',
    normalized: 3
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

describe('RELY-02 canonical projection behavior', () => {
  it('should generate recap only from canonical draft data (RELY-02)', () => {
    const draft = buildSampleDraft();

    const recap = buildConstraintRecap(draft);

    expect(recap.summary).toContain('Origin: 北京');
    expect(recap.summary).toContain('Destination: 杭州');
    expect(recap.sections.join(' ')).toContain('Date range: 2026-05-01 to 2026-05-03');
  });

  it('should regenerate full recap after patch updates without dropping accepted slots', () => {
    const draft = buildSampleDraft();

    const patched = applyConstraintPatch(
      draft,
      {
        intensity: {
          raw: 'challenge',
          normalized: 'challenge'
        }
      },
      'turn-revision',
      '2026-04-20T15:30:00Z'
    );

    const recap = regenerateFullRecap(patched);

    expect(recap.summary).toContain('Origin: 北京');
    expect(recap.summary).toContain('Intensity: challenge');
    expect(patched.revisionLog.at(-1)?.field).toBe('intensity');
  });

  it('should include assumption notes and one-turn correction path markers', async () => {
    const draft = buildSampleDraft();
    draft.assumptions = {
      waypoint: 'Assumed nearby district center'
    };

    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-recap-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    await repository.createDraft(draft.sessionId, draft);

    const recap = await buildConstraintRecapFromRepository(repository, draft.sessionId);

    expect(recap.assumptionNotes.join(' ')).toMatch(/assumption/i);
    expect(recap.correctionPath).toMatch(/correction/i);
  });
});
