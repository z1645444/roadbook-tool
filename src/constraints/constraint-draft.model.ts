export type SlotStatus = 'missing' | 'accepted' | 'ambiguous';
export type IntensityProfile = 'easy' | 'standard' | 'challenge';

export interface CanonicalPoint {
  provider: 'amap';
  providerId: string;
  name: string;
  lng: number;
  lat: number;
  confidence: number;
}

export interface NormalizedDateRange {
  startDate: string;
  endDate: string;
}

export interface NormalizedRideWindow {
  start: string;
  end: string;
  minutes: number;
}

export interface RevisionEntry {
  field: string;
  turnId: string;
  timestampIso: string;
}

export interface PointSlot {
  raw: string;
  status: SlotStatus;
  normalized?: CanonicalPoint;
}

export interface WaypointSlot {
  raw: string;
  status: 'accepted' | 'ambiguous';
  normalized?: CanonicalPoint;
}

export interface ConstraintDraft {
  id: string;
  sessionId: string;
  slots: {
    origin?: PointSlot;
    destination?: PointSlot;
    waypoints: WaypointSlot[];
    dateRange?: { raw: string; normalized?: NormalizedDateRange };
    tripDays?: { raw: string; normalized?: number };
    rideWindow?: { raw: string; normalized?: NormalizedRideWindow };
    intensity?: { raw: string; normalized?: IntensityProfile };
  };
  assumptions?: Record<string, string>;
  revisionLog: RevisionEntry[];
}

export const createConstraintDraft = (
  id: string,
  sessionId: string
): ConstraintDraft => ({
  id,
  sessionId,
  slots: {
    waypoints: []
  },
  revisionLog: []
});
