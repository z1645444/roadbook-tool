import type {
  BicyclingSegmentInput,
  BicyclingSegmentResult,
  MapProvider
} from './map-provider.port';
import { mapAmapError } from './amap-error.mapper';

interface AmapBicyclingResponse {
  errcode?: number;
  errmsg?: string;
  data?: {
    paths?: Array<{
      distance?: string;
      duration?: string;
      steps?: Array<{
        polyline?: string;
      }>;
    }>;
  };
}

const AMAP_BICYCLING_ENDPOINT = 'https://restapi.amap.com/v4/direction/bicycling';

const parsePolyline = (raw?: string): Array<{ lng: number; lat: number }> => {
  if (!raw) {
    return [];
  }

  return raw
    .split(';')
    .map((item) => {
      const [lngRaw, latRaw] = item.split(',');
      return {
        lng: Number(lngRaw),
        lat: Number(latRaw)
      };
    })
    .filter((point) => Number.isFinite(point.lng) && Number.isFinite(point.lat));
};

export class AmapBicyclingAdapter implements Pick<MapProvider, 'routeBicyclingSegment'> {
  constructor(private readonly apiKey: string = process.env.AMAP_API_KEY ?? '') {
    if (!this.apiKey) {
      throw mapAmapError({ infocode: '10001', endpoint: 'bicycling' });
    }
  }

  async routeBicyclingSegment(input: BicyclingSegmentInput): Promise<BicyclingSegmentResult> {
    const search = new URLSearchParams({
      key: this.apiKey,
      origin: `${input.from.lng},${input.from.lat}`,
      destination: `${input.to.lng},${input.to.lat}`
    });

    let response: Response;

    try {
      response = await fetch(`${AMAP_BICYCLING_ENDPOINT}?${search.toString()}`);
    } catch {
      throw mapAmapError({ endpoint: 'bicycling' });
    }

    let payload: AmapBicyclingResponse;

    try {
      payload = (await response.json()) as AmapBicyclingResponse;
    } catch {
      throw mapAmapError({ endpoint: 'bicycling' });
    }

    if (!response.ok || payload.errcode !== 0) {
      throw mapAmapError({
        infocode: typeof payload.errcode === 'number' ? String(payload.errcode) : undefined,
        info: payload.errmsg,
        endpoint: 'bicycling'
      });
    }

    const firstPath = payload.data?.paths?.[0];
    if (!firstPath) {
      throw mapAmapError({ endpoint: 'bicycling' });
    }

    return {
      distanceMeters: Number(firstPath.distance ?? 0),
      durationSeconds: Number(firstPath.duration ?? 0),
      polyline: parsePolyline(firstPath.steps?.[0]?.polyline)
    };
  }
}
