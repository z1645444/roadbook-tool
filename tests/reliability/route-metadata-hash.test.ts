import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { buildRouteGenerationMetadata } from '../../src/reliability/repro-metadata.service';
import { createConstraintDraft } from '../../src/constraints/constraint-draft.model';
import { StorageBackedConstraintDraftRepository } from '../../src/constraints/constraint-draft.repository';
import { safeParseConstraintDraft } from '../../src/shared/validation/constraint-draft.schema';

describe('RELY-03 route metadata fingerprint and persistence', () => {
  it('should include generatedAtIso/provider/endpoint/requestFingerprint/responseHash fields', () => {
    const metadata = buildRouteGenerationMetadata({
      provider: 'amap',
      endpoint: '/v4/direction/bicycling',
      requestPayload: { origin: '120.1,30.2', destination: '120.2,30.3' },
      responsePayload: { distanceMeters: 1000, durationSeconds: 200 },
      infocode: '10000',
      generatedAt: new Date('2026-04-21T12:34:56+08:00')
    });

    expect(metadata.generatedAtIso).toBeTruthy();
    expect(metadata.provider).toBe('amap');
    expect(metadata.endpoint).toBe('/v4/direction/bicycling');
    expect(metadata.requestFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.responseHash).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.infocode).toBe('10000');
  });

  it('should keep deterministic requestFingerprint for the same request payload', () => {
    const requestPayload = { origin: '120.1,30.2', destination: '120.2,30.3' };
    const first = buildRouteGenerationMetadata({
      provider: 'amap',
      endpoint: '/v4/direction/bicycling',
      requestPayload,
      responsePayload: { distanceMeters: 1000 },
      generatedAt: new Date('2026-04-21T10:00:00+08:00')
    });
    const second = buildRouteGenerationMetadata({
      provider: 'amap',
      endpoint: '/v4/direction/bicycling',
      requestPayload,
      responsePayload: { distanceMeters: 2000 },
      generatedAt: new Date('2026-04-21T10:05:00+08:00')
    });

    expect(first.requestFingerprint).toBe(second.requestFingerprint);
    expect(first.responseHash).not.toBe(second.responseHash);
  });

  it('should roundtrip routeGeneration metadata through repository and schema validation', async () => {
    const storageDir = await mkdtemp(join(tmpdir(), 'roadbook-route-metadata-'));
    const repository = new StorageBackedConstraintDraftRepository(
      join(storageDir, 'storage/constraint-drafts.json')
    );

    const draft = createConstraintDraft('draft-metadata', 'session-metadata');
    await repository.createDraft(draft.sessionId, draft);

    const metadata = buildRouteGenerationMetadata({
      provider: 'amap',
      endpoint: '/v4/direction/bicycling',
      requestPayload: { foo: 1 },
      responsePayload: { bar: 2 }
    });

    await repository.updateDraft(draft.sessionId, (current) => ({
      ...current,
      routeGeneration: {
        latest: metadata,
        history: [metadata]
      }
    }));

    const reloaded = await repository.getBySessionId(draft.sessionId);
    expect(reloaded?.routeGeneration?.latest.requestFingerprint).toBe(metadata.requestFingerprint);

    const parsed = safeParseConstraintDraft(reloaded);
    expect(parsed.success).toBe(true);
  });
});
