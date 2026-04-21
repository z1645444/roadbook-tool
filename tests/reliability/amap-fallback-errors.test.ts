import { describe, expect, it } from 'vitest';

import { mapAmapError } from '../../src/map-provider/amap-error.mapper';
import { AmapBicyclingAdapter } from '../../src/map-provider/amap-bicycling.adapter';
import { AmapGeocodeAdapter } from '../../src/map-provider/amap-geocode.adapter';
import { RoutingFallbackError } from '../../src/reliability/routing-fallback.error';

describe('RELY-01 amap fallback mapping and safe user messages', () => {
  it('should map auth and quota infocodes into deterministic fallback categories', () => {
    const auth = mapAmapError({ infocode: '10001', endpoint: 'geocode' });
    const quota = mapAmapError({ infocode: '10003', endpoint: 'bicycling' });

    expect(auth).toBeInstanceOf(RoutingFallbackError);
    expect(auth.category).toBe('auth_error');
    expect(auth.retryable).toBe(false);

    expect(quota.category).toBe('quota_error');
    expect(quota.retryable).toBe(false);
  });

  it('should map rate/provider/unknown failures into fallback-safe messages', () => {
    const rate = mapAmapError({ infocode: '10029', endpoint: 'geocode' });
    const provider = mapAmapError({ infocode: '20000', endpoint: 'bicycling' });
    const unknown = mapAmapError({ endpoint: 'geocode' });

    expect(rate.category).toBe('rate_limited');
    expect(provider.category).toBe('provider_unavailable');
    expect(unknown.category).toBe('unknown_provider_error');

    for (const error of [rate, provider, unknown]) {
      expect(error.userMessage).not.toContain('key=');
      expect(error.userMessage).not.toContain('http');
      expect(error.userMessage).not.toContain('stack');
    }
  });

  it('should throw sanitized fallback error when geocode transport fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => {
      throw new Error('network failed');
    };

    try {
      const adapter = new AmapGeocodeAdapter('test-key');
      await expect(adapter.geocodePoint({ query: '北京' })).rejects.toMatchObject({
        category: 'unknown_provider_error'
      });
      await expect(adapter.geocodePoint({ query: '北京' })).rejects.not.toMatchObject({
        userMessage: expect.stringContaining('test-key')
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should throw mapped fallback error when bicycling endpoint fails', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      ({
        ok: false,
        json: async () => ({ errcode: 10029, errmsg: 'too many requests' })
      } as Response);

    try {
      const adapter = new AmapBicyclingAdapter('test-key');
      await expect(
        adapter.routeBicyclingSegment({
          from: { lng: 120.1, lat: 30.2 },
          to: { lng: 120.2, lat: 30.3 }
        })
      ).rejects.toMatchObject({
        category: 'rate_limited'
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});
