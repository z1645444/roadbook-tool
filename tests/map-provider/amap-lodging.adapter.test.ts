import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RoutingFallbackError } from '../../src/reliability/routing-fallback.error';
import { AmapLodgingAdapter } from '../../src/map-provider/amap-lodging.adapter';

describe('AmapLodgingAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call AMap with deterministic query envelope and map payload fields', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: '1',
        info: 'OK',
        infocode: '10000',
        pois: [
          {
            id: 'poi-1',
            name: 'hotel-a',
            distance: '1200',
            biz_ext: {
              rating: '4.6',
              cost: '188'
            }
          }
        ]
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new AmapLodgingAdapter('test-key');
    const result = await adapter.searchLodgingAround({
      anchor: { providerId: 'anchor-1', lng: 120.1, lat: 30.2 },
      radiusMeters: 11999,
      page: 5,
      sessionId: 'session-1',
      dayIndex: 1,
      category: 'hotel'
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestUrl).toContain('https://restapi.amap.com/v3/place/around?');
    expect(requestUrl).toContain('key=test-key');
    expect(requestUrl).toContain('location=120.1%2C30.2');
    expect(requestUrl).toContain('radius=12000');
    expect(requestUrl).toContain('types=100301%7C100302%7C100303');
    expect(requestUrl).toContain('sortrule=distance');
    expect(requestUrl).toContain('page=2');
    expect(requestUrl).toContain('offset=20');

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toEqual({
      providerId: 'poi-1',
      name: 'hotel-a',
      type: 'hotel',
      distanceMeters: 1200,
      rating: 4.6,
      priceCny: 188,
      policyStage: 'strict'
    });
  });

  it('should map timeout/network failures to RoutingFallbackError for lodging endpoint', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network timeout');
    });
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new AmapLodgingAdapter('test-key', 3000);
    const promise = adapter.searchLodgingAround({
      anchor: { providerId: 'anchor-2', lng: 121.1, lat: 31.2 },
      radiusMeters: 8000,
      page: 1,
      sessionId: 'session-2',
      dayIndex: 2,
      category: 'hostel'
    });

    const error = await promise.catch((caught) => caught as RoutingFallbackError);
    expect(error).toBeInstanceOf(RoutingFallbackError);
    expect(error.userMessage).toContain('（lodging）');
  });

  it('should clamp radius and page before request and map non-success payload to fallback', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        status: '0',
        info: 'INVALID_USER_KEY',
        infocode: '10001'
      })
    }));
    vi.stubGlobal('fetch', fetchMock);

    const adapter = new AmapLodgingAdapter('test-key');
    const promise = adapter.searchLodgingAround({
      anchor: { providerId: 'anchor-3', lng: 118.1, lat: 32.2 },
      radiusMeters: 500,
      page: 0,
      sessionId: 'session-3',
      dayIndex: 3,
      category: 'guesthouse'
    });

    await expect(promise).rejects.toBeInstanceOf(RoutingFallbackError);
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestUrl).toContain('radius=8000');
    expect(requestUrl).toContain('page=1');
    expect(requestUrl).toContain('types=100105');
  });
});
