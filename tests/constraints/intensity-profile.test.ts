import { describe, expect, it } from 'vitest';

import { normalizeIntensityProfile } from '../../src/constraints/constraint-normalizer.service';

describe('CONV-05 intensity profile normalization', () => {
  it('should map easy profile to deterministic caps', () => {
    const result = normalizeIntensityProfile('easy');

    expect(result.profile).toBe('easy');
    expect(result.caps).toEqual({
      distanceKm: 70,
      rideMinutes: 300
    });
  });

  it('should map standard profile to deterministic caps', () => {
    const result = normalizeIntensityProfile('standard');

    expect(result.profile).toBe('standard');
    expect(result.caps).toEqual({
      distanceKm: 110,
      rideMinutes: 420
    });
  });

  it('should map challenge profile to deterministic caps', () => {
    const result = normalizeIntensityProfile('challenge');

    expect(result.profile).toBe('challenge');
    expect(result.caps).toEqual({
      distanceKm: 150,
      rideMinutes: 540
    });
  });

  it('should reject unsupported profiles', () => {
    expect(() => normalizeIntensityProfile('race')).toThrow(/Unsupported intensity profile/i);
  });
});
