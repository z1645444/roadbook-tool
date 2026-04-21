import type {
  LodgingCandidate,
  LodgingCategory,
  LodgingSearchInput,
  LodgingSearchResult,
  MapProvider
} from './map-provider.port';
import { mapAmapError } from './amap-error.mapper';

interface AmapLodgingPoi {
  id?: string;
  name?: string;
  distance?: string;
  biz_ext?: {
    rating?: string;
    cost?: string;
  };
}

interface AmapLodgingResponse {
  status?: string;
  info?: string;
  infocode?: string;
  pois?: AmapLodgingPoi[];
}

const AMAP_LODGING_ENDPOINT = 'https://restapi.amap.com/v3/place/around';
const DEFAULT_TIMEOUT_MS = 3000;
const AMAP_OFFSET = '20';
const MAX_PAGE = 2;
const SUPPORTED_RADII = new Set([8000, 12000, 20000]);

const AMAP_LODGING_TYPES: Record<LodgingCategory, string> = {
  hostel: '100103|100104',
  guesthouse: '100105',
  hotel: '100301|100302|100303'
};

const toFiniteNumberOrNull = (value?: string): number | null => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRadius = (radiusMeters: number): number => {
  if (SUPPORTED_RADII.has(radiusMeters)) {
    return radiusMeters;
  }
  if (radiusMeters <= 8000) {
    return 8000;
  }
  if (radiusMeters <= 12000) {
    return 12000;
  }
  return 20000;
};

const parseCandidate = (poi: AmapLodgingPoi, category: LodgingCategory): LodgingCandidate | null => {
  if (!poi.id || !poi.name) {
    return null;
  }
  const distance = Number(poi.distance);
  if (!Number.isFinite(distance) || distance < 0) {
    return null;
  }

  return {
    providerId: poi.id,
    name: poi.name,
    type: category,
    distanceMeters: distance,
    rating: toFiniteNumberOrNull(poi.biz_ext?.rating),
    priceCny: toFiniteNumberOrNull(poi.biz_ext?.cost),
    policyStage: 'strict'
  };
};

export class AmapLodgingAdapter implements Pick<MapProvider, 'searchLodgingAround'> {
  constructor(
    private readonly apiKey: string = process.env.AMAP_API_KEY ?? '',
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS
  ) {
    if (!this.apiKey) {
      throw mapAmapError({ infocode: '10001', endpoint: 'lodging' });
    }
  }

  async searchLodgingAround(input: LodgingSearchInput): Promise<LodgingSearchResult> {
    const radius = normalizeRadius(input.radiusMeters);
    const page = Math.min(Math.max(1, input.page), MAX_PAGE);
    const search = new URLSearchParams({
      key: this.apiKey,
      location: `${input.anchor.lng},${input.anchor.lat}`,
      radius: String(radius),
      types: AMAP_LODGING_TYPES[input.category],
      sortrule: 'distance',
      page: String(page),
      offset: AMAP_OFFSET
    });

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${AMAP_LODGING_ENDPOINT}?${search.toString()}`, {
        signal: abortController.signal
      });
    } catch {
      throw mapAmapError({ endpoint: 'lodging' });
    } finally {
      clearTimeout(timeoutId);
    }

    let payload: AmapLodgingResponse;
    try {
      payload = (await response.json()) as AmapLodgingResponse;
    } catch {
      throw mapAmapError({ endpoint: 'lodging' });
    }

    if (!response.ok || payload.status !== '1') {
      throw mapAmapError({
        infocode: payload.infocode,
        info: payload.info,
        endpoint: 'lodging'
      });
    }

    const candidates = (payload.pois ?? [])
      .map((poi) => parseCandidate(poi, input.category))
      .filter((item): item is LodgingCandidate => Boolean(item));

    return {
      candidates,
      infocode: payload.infocode,
      info: payload.info
    };
  }
}
