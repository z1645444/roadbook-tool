export type RoadbookLodgingType = 'hostel' | 'guesthouse' | 'hotel';

export type RoadbookPolicyStage = 'strict' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';

export interface RoadbookRenderPoint {
  providerId: string;
  name: string;
  lng: number;
  lat: number;
}

export interface RoadbookRenderSegment {
  from: RoadbookRenderPoint;
  to: RoadbookRenderPoint;
  distanceMeters: number;
  durationSeconds: number;
  polyline: Array<{ lng: number; lat: number }>;
}

export interface RoadbookRenderLodgingEntry {
  providerId: string;
  name: string;
  type: RoadbookLodgingType;
  distanceMeters: number;
  rating: number | null;
  priceCny: number | null;
  policyStage: RoadbookPolicyStage;
}

export interface RoadbookRenderDayLodging {
  policyStatus: 'compliant' | 'relaxed' | 'no_match';
  fallbackTrace: string[];
  categories: {
    hostel: RoadbookRenderLodgingEntry[];
    guesthouse: RoadbookRenderLodgingEntry[];
    hotel: RoadbookRenderLodgingEntry[];
  };
}

export interface RoadbookRenderDay {
  dayIndex: number;
  startPoint: RoadbookRenderPoint | null;
  endPoint: RoadbookRenderPoint | null;
  overnightStopPoint: RoadbookRenderPoint | null;
  segments: RoadbookRenderSegment[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  lodging: RoadbookRenderDayLodging | null;
}

export interface RoadbookRenderMetadata {
  generatedAtIso: string;
  provider: string;
  endpoint: string;
  requestFingerprint: string;
  responseHash: string;
  infocode?: string;
}

export interface RoadbookRenderOptions {
  title?: string;
  includeValidationContext?: boolean;
}

export interface RoadbookRenderInput {
  recap: {
    summary: string;
    assumptions: string[];
  } | null;
  routePlan: RoadbookRenderDay[];
  routeMetadata: RoadbookRenderMetadata | null;
  options?: RoadbookRenderOptions;
}
