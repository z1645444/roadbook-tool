import type { IntensityProfile } from './constraint-draft.model';

export interface IntensityCaps {
  distanceKm: number;
  rideMinutes: number;
}

const INTENSITY_CAPS: Record<IntensityProfile, IntensityCaps> = {
  easy: {
    distanceKm: 70,
    rideMinutes: 300
  },
  standard: {
    distanceKm: 110,
    rideMinutes: 420
  },
  challenge: {
    distanceKm: 150,
    rideMinutes: 540
  }
};

export const normalizeIntensityProfile = (
  raw: string
): { profile: IntensityProfile; caps: IntensityCaps } => {
  const normalized = raw.trim().toLowerCase();

  if (!Object.prototype.hasOwnProperty.call(INTENSITY_CAPS, normalized)) {
    throw new Error(`Unsupported intensity profile: ${raw}`);
  }

  const profile = normalized as IntensityProfile;
  return {
    profile,
    caps: INTENSITY_CAPS[profile]
  };
};
