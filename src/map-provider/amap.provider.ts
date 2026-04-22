import type {
  BicyclingSegmentInput,
  BicyclingSegmentResult,
  GeocodePointInput,
  GeocodePointResult,
  LodgingSearchInput,
  LodgingSearchResult,
  MapProvider
} from './map-provider.port';
import { AmapBicyclingAdapter } from './amap-bicycling.adapter';
import { AmapGeocodeAdapter } from './amap-geocode.adapter';
import { AmapLodgingAdapter } from './amap-lodging.adapter';

export class AmapProvider implements MapProvider {
  private readonly geocodeAdapter: AmapGeocodeAdapter;
  private readonly bicyclingAdapter: AmapBicyclingAdapter;
  private readonly lodgingAdapter: AmapLodgingAdapter;

  constructor(apiKey: string = process.env.AMAP_API_KEY ?? '') {
    this.geocodeAdapter = new AmapGeocodeAdapter(apiKey);
    this.bicyclingAdapter = new AmapBicyclingAdapter(apiKey);
    this.lodgingAdapter = new AmapLodgingAdapter(apiKey);
  }

  geocodePoint(input: GeocodePointInput): Promise<GeocodePointResult> {
    return this.geocodeAdapter.geocodePoint(input);
  }

  routeBicyclingSegment(input: BicyclingSegmentInput): Promise<BicyclingSegmentResult> {
    return this.bicyclingAdapter.routeBicyclingSegment(input);
  }

  searchLodgingAround(input: LodgingSearchInput): Promise<LodgingSearchResult> {
    return this.lodgingAdapter.searchLodgingAround(input);
  }
}
