export interface GeocodePointInput {
  query: string;
  city?: string;
}

export const MAP_PROVIDER = Symbol('MAP_PROVIDER');

export interface GeocodeCandidate {
  provider: 'amap';
  providerId: string;
  name: string;
  lng: number;
  lat: number;
  confidence: number;
}

export interface GeocodePointResult {
  candidates: GeocodeCandidate[];
  infocode?: string;
  info?: string;
}

export interface BicyclingCoordinate {
  lng: number;
  lat: number;
}

export interface BicyclingSegmentInput {
  from: BicyclingCoordinate;
  to: BicyclingCoordinate;
}

export interface BicyclingSegmentResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: BicyclingCoordinate[];
  infocode?: string;
  info?: string;
}

export type LodgingCategory = 'hostel' | 'guesthouse' | 'hotel';

export type LodgingPolicyStage = 'strict' | 'radius_12km' | 'radius_20km' | 'price_relaxed_20';

export interface LodgingSearchInput {
  anchor: {
    providerId: string;
    lng: number;
    lat: number;
  };
  radiusMeters: number;
  page: number;
  sessionId: string;
  dayIndex: number;
  category: LodgingCategory;
}

export interface LodgingCandidate {
  providerId: string;
  name: string;
  type: LodgingCategory;
  distanceMeters: number;
  rating: number | null;
  priceCny: number | null;
  policyStage: LodgingPolicyStage;
}

export interface LodgingSearchResult {
  candidates: LodgingCandidate[];
  infocode?: string;
  info?: string;
}

export interface MapProvider {
  geocodePoint(input: GeocodePointInput): Promise<GeocodePointResult>;
  routeBicyclingSegment(input: BicyclingSegmentInput): Promise<BicyclingSegmentResult>;
  searchLodgingAround?(input: LodgingSearchInput): Promise<LodgingSearchResult>;
}
