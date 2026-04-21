export type RoutingFallbackCategory =
  | 'auth_error'
  | 'quota_error'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'unknown_provider_error';

interface RoutingFallbackPayload {
  category: RoutingFallbackCategory;
  userMessage: string;
  retryable: boolean;
}

export class RoutingFallbackError extends Error {
  readonly category: RoutingFallbackCategory;
  readonly userMessage: string;
  readonly retryable: boolean;

  constructor(payload: RoutingFallbackPayload) {
    super(payload.userMessage);
    this.name = 'RoutingFallbackError';
    this.category = payload.category;
    this.userMessage = payload.userMessage;
    this.retryable = payload.retryable;
  }
}
