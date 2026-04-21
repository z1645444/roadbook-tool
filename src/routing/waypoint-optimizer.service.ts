import type { GeocodeCandidate, MapProvider } from '../map-provider/map-provider.port';
import { safeParseMultidayRouteArtifact } from '../shared/validation/multiday-route-artifact.schema';

export interface WaypointOptimizationResult {
  optimizedPoints: GeocodeCandidate[];
}

interface CandidateScore {
  distanceMeters: number;
  durationSeconds: number;
  sortKey: string;
}

const MAX_INTERMEDIATE_PERMUTATION_POINTS = 8;

const permutations = (points: GeocodeCandidate[]): GeocodeCandidate[][] => {
  if (points.length <= 1) {
    return [points];
  }

  const output: GeocodeCandidate[][] = [];
  for (let index = 0; index < points.length; index += 1) {
    const head = points[index];
    const rest = points.slice(0, index).concat(points.slice(index + 1));
    for (const tail of permutations(rest)) {
      output.push([head, ...tail]);
    }
  }

  return output;
};

const scoreCandidate = async (
  points: GeocodeCandidate[],
  provider: Pick<MapProvider, 'routeBicyclingSegment'>
): Promise<CandidateScore> => {
  let distanceMeters = 0;
  let durationSeconds = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const segment = await provider.routeBicyclingSegment({
      from: { lng: from.lng, lat: from.lat },
      to: { lng: to.lng, lat: to.lat }
    });
    distanceMeters += segment.distanceMeters;
    durationSeconds += segment.durationSeconds;
  }

  return {
    distanceMeters,
    durationSeconds,
    // tie-break: lexical providerId sequence for deterministic output.
    sortKey: points.map((point) => point.providerId).join('|')
  };
};

const validateOptimizationPayload = (
  optimizedPoints: GeocodeCandidate[]
): WaypointOptimizationResult => {
  const payload = {
    optimizedPoints,
    days: [],
    totals: {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0
    }
  };
  const parsed = safeParseMultidayRouteArtifact(payload);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid multiday optimization artifact: ${issues}`);
  }

  return { optimizedPoints };
};

export const optimizeWaypointSequence = async (
  points: GeocodeCandidate[],
  provider: Pick<MapProvider, 'routeBicyclingSegment'>
): Promise<WaypointOptimizationResult> => {
  if (points.length < 2) {
    throw new Error('At least origin and destination points are required for optimization');
  }

  // fixed origin
  const origin = points[0];
  // fixed destination
  const destination = points[points.length - 1];
  const intermediates = points.slice(1, -1);

  if (intermediates.length < 2) {
    return validateOptimizationPayload(points);
  }

  if (intermediates.length > MAX_INTERMEDIATE_PERMUTATION_POINTS) {
    const deterministicFallback = intermediates
      .slice()
      .sort((left, right) => left.providerId.localeCompare(right.providerId));
    return validateOptimizationPayload([origin, ...deterministicFallback, destination]);
  }

  let best: { points: GeocodeCandidate[]; score: CandidateScore } | null = null;
  for (const ordering of permutations(intermediates)) {
    const candidate = [origin, ...ordering, destination];
    const score = await scoreCandidate(candidate, provider);
    if (!best) {
      best = { points: candidate, score };
      continue;
    }

    const betterDistance = score.distanceMeters < best.score.distanceMeters;
    const sameDistance = score.distanceMeters === best.score.distanceMeters;
    const betterDuration = score.durationSeconds < best.score.durationSeconds;
    const sameDuration = score.durationSeconds === best.score.durationSeconds;
    const betterTieBreak = score.sortKey.localeCompare(best.score.sortKey) < 0;

    if (
      betterDistance ||
      (sameDistance && betterDuration) ||
      (sameDistance && sameDuration && betterTieBreak)
    ) {
      best = { points: candidate, score };
    }
  }

  return validateOptimizationPayload(best?.points ?? points);
};
