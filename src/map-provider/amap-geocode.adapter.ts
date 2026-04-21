import type {
  GeocodeCandidate,
  GeocodePointInput,
  GeocodePointResult,
  MapProvider
} from './map-provider.port';
import { mapAmapError } from './amap-error.mapper';

interface AmapGeocodeResponse {
  status?: string;
  info?: string;
  infocode?: string;
  geocodes?: Array<{
    id?: string;
    formatted_address?: string;
    location?: string;
  }>;
}

const AMAP_GEOCODE_ENDPOINT = 'https://restapi.amap.com/v3/geocode/geo';

const parseLocation = (raw?: string): { lng: number; lat: number } => {
  if (!raw) {
    throw new Error('missing geocode location');
  }

  const [lngRaw, latRaw] = raw.split(',');
  const lng = Number(lngRaw);
  const lat = Number(latRaw);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw new Error('invalid geocode location coordinates');
  }

  return { lng, lat };
};

export class AmapGeocodeAdapter implements Pick<MapProvider, 'geocodePoint'> {
  constructor(private readonly apiKey: string = process.env.AMAP_API_KEY ?? '') {
    if (!this.apiKey) {
      throw mapAmapError({ infocode: '10001', endpoint: 'geocode' });
    }
  }

  async geocodePoint(input: GeocodePointInput): Promise<GeocodePointResult> {
    const search = new URLSearchParams({
      key: this.apiKey,
      address: input.query
    });

    if (input.city) {
      search.set('city', input.city);
    }

    let response: Response;

    try {
      response = await fetch(`${AMAP_GEOCODE_ENDPOINT}?${search.toString()}`);
    } catch {
      throw mapAmapError({ endpoint: 'geocode' });
    }

    let payload: AmapGeocodeResponse;

    try {
      payload = (await response.json()) as AmapGeocodeResponse;
    } catch {
      throw mapAmapError({ endpoint: 'geocode' });
    }

    if (!response.ok || payload.status !== '1') {
      throw mapAmapError({ infocode: payload.infocode, info: payload.info, endpoint: 'geocode' });
    }

    const candidates: GeocodeCandidate[] = (payload.geocodes ?? []).map((item, index) => {
      const coords = parseLocation(item.location);

      return {
        provider: 'amap',
        providerId: item.id ?? `${input.query}-${index}`,
        name: item.formatted_address ?? input.query,
        lng: coords.lng,
        lat: coords.lat,
        confidence: index === 0 ? 0.97 : 0.9
      };
    });

    return {
      candidates,
      infocode: payload.infocode,
      info: payload.info
    };
  }
}
