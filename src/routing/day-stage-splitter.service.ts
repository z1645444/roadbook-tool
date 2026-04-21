import type { ConstraintDraft } from '../constraints/constraint-draft.model';
import type { OrderedRouteSegment } from './segment-routing.service';
import { safeParseMultidayRouteArtifact } from '../shared/validation/multiday-route-artifact.schema';
import { normalizeIntensityProfile } from '../constraints/constraint-normalizer.service';

export interface DayStagePlan {
  dayIndex: number;
  startPoint: OrderedRouteSegment['from'];
  endPoint: OrderedRouteSegment['to'];
  overnightStopPoint: OrderedRouteSegment['to'] | null;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  segments: OrderedRouteSegment[];
}

const resolveDailyCapMinutes = (draft: ConstraintDraft): number => {
  const rideWindowMinutes = draft.slots.rideWindow?.normalized?.minutes;
  const intensityRaw = draft.slots.intensity?.raw;
  const intensityMinutes = intensityRaw
    ? normalizeIntensityProfile(intensityRaw).caps.rideMinutes
    : undefined;

  if (rideWindowMinutes && intensityMinutes) {
    return Math.min(rideWindowMinutes, intensityMinutes);
  }
  if (rideWindowMinutes) {
    return rideWindowMinutes;
  }
  if (intensityMinutes) {
    return intensityMinutes;
  }

  return 420;
};

const toDayStage = (dayIndex: number, segments: OrderedRouteSegment[]): DayStagePlan => {
  if (segments.length === 0) {
    throw new Error(`Cannot build day stage ${dayIndex} from empty segment list`);
  }

  const startPoint = segments[0].from;
  const endPoint = segments[segments.length - 1].to;
  const totals = segments.reduce(
    (acc, segment) => ({
      totalDistanceMeters: acc.totalDistanceMeters + segment.distanceMeters,
      totalDurationSeconds: acc.totalDurationSeconds + segment.durationSeconds
    }),
    {
      totalDistanceMeters: 0,
      totalDurationSeconds: 0
    }
  );

  return {
    dayIndex,
    startPoint,
    endPoint,
    overnightStopPoint: null,
    totalDistanceMeters: totals.totalDistanceMeters,
    totalDurationSeconds: totals.totalDurationSeconds,
    segments
  };
};

const validateMultidayArtifact = (
  optimizedPoints: OrderedRouteSegment['from'][],
  days: DayStagePlan[]
): void => {
  const payload = {
    optimizedPoints,
    days,
    totals: days.reduce(
      (acc, day) => ({
        totalDistanceMeters: acc.totalDistanceMeters + day.totalDistanceMeters,
        totalDurationSeconds: acc.totalDurationSeconds + day.totalDurationSeconds
      }),
      {
        totalDistanceMeters: 0,
        totalDurationSeconds: 0
      }
    )
  };

  const parsed = safeParseMultidayRouteArtifact(payload);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid day-stage artifact: ${issues}`);
  }
};

export const splitRouteIntoDayStages = (
  segments: OrderedRouteSegment[],
  draft: ConstraintDraft,
  optimizedPoints: OrderedRouteSegment['from'][]
): DayStagePlan[] => {
  if (segments.length === 0) {
    return [];
  }

  const dailyMaxRideMinutes = resolveDailyCapMinutes(draft);
  const dailyMaxRideSeconds = dailyMaxRideMinutes * 60;
  const days: DayStagePlan[] = [];

  let current: OrderedRouteSegment[] = [];
  let currentDurationSeconds = 0;

  for (const segment of segments) {
    const shouldSplit =
      current.length > 0 && currentDurationSeconds + segment.durationSeconds > dailyMaxRideSeconds;
    if (shouldSplit) {
      days.push(toDayStage(days.length + 1, current));
      current = [];
      currentDurationSeconds = 0;
    }

    current.push(segment);
    currentDurationSeconds += segment.durationSeconds;
  }

  if (current.length > 0) {
    days.push(toDayStage(days.length + 1, current));
  }

  for (let index = 0; index < days.length; index += 1) {
    days[index].overnightStopPoint = index === days.length - 1 ? null : days[index].endPoint;
  }

  validateMultidayArtifact(optimizedPoints, days);
  return days;
};
