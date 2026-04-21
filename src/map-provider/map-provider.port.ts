export interface GeocodePointInput {
  query: string;
  city?: string;
}

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

export interface MapProvider {
  geocodePoint(input: GeocodePointInput): Promise<GeocodePointResult>;
  routeBicyclingSegment(input: BicyclingSegmentInput): Promise<BicyclingSegmentResult>;
}
