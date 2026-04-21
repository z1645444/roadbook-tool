import {
  RoutingFallbackError,
  type RoutingFallbackCategory
} from '../reliability/routing-fallback.error';

interface MapAmapErrorInput {
  infocode?: string;
  info?: string;
  endpoint: 'geocode' | 'bicycling' | 'lodging';
}

const CATEGORY_MESSAGES: Record<RoutingFallbackCategory, string> = {
  auth_error: '地图服务鉴权失败，请稍后重试。',
  quota_error: '地图服务配额不足，请稍后再试。',
  rate_limited: '地图服务请求过于频繁，请稍后重试。',
  provider_unavailable: '地图服务暂时不可用，请稍后重试。',
  unknown_provider_error: '路线服务暂时不可用，请稍后重试。'
};

const RATE_LIMIT_CODES = new Set(['10021', '10029']);
const QUOTA_CODES = new Set(['10003', '10044']);
const AUTH_CODES = new Set(['10001', '10002', '10004']);
const PROVIDER_CODES = new Set(['20000', '20800']);

const resolveCategory = (infocode?: string): RoutingFallbackCategory => {
  if (!infocode) {
    return 'unknown_provider_error';
  }

  if (AUTH_CODES.has(infocode)) {
    return 'auth_error';
  }

  if (QUOTA_CODES.has(infocode)) {
    return 'quota_error';
  }

  if (RATE_LIMIT_CODES.has(infocode)) {
    return 'rate_limited';
  }

  if (PROVIDER_CODES.has(infocode)) {
    return 'provider_unavailable';
  }

  return 'unknown_provider_error';
};

export const mapAmapError = ({ infocode, endpoint }: MapAmapErrorInput): RoutingFallbackError => {
  const category = resolveCategory(infocode);

  return new RoutingFallbackError({
    category,
    retryable: category !== 'auth_error' && category !== 'quota_error',
    userMessage: `${CATEGORY_MESSAGES[category]}（${endpoint}）`
  });
};
