import { createHash } from 'node:crypto';

export interface BuildRouteGenerationMetadataInput {
  provider: string;
  endpoint: string;
  requestPayload: unknown;
  responsePayload: unknown;
  infocode?: string;
  generatedAt?: Date;
}

export interface RouteGenerationMetadata {
  generatedAtIso: string;
  provider: string;
  endpoint: string;
  requestFingerprint: string;
  responseHash: string;
  infocode?: string;
}

const stableStringify = (value: unknown): string => JSON.stringify(value);

const hashPayload = (value: unknown): string =>
  createHash('sha256').update(stableStringify(value)).digest('hex');

const toIsoWithOffset = (date: Date): string => {
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const sign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(timezoneOffsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
  const minutes = String(absoluteMinutes % 60).padStart(2, '0');
  const isoBase = new Date(date.getTime() - date.getMilliseconds())
    .toISOString()
    .replace('Z', '');
  return `${isoBase}${sign}${hours}:${minutes}`;
};

export const buildRouteGenerationMetadata = (
  input: BuildRouteGenerationMetadataInput
): RouteGenerationMetadata => ({
  generatedAtIso: toIsoWithOffset(input.generatedAt ?? new Date()),
  provider: input.provider,
  endpoint: input.endpoint,
  requestFingerprint: hashPayload(input.requestPayload),
  responseHash: hashPayload(input.responsePayload),
  infocode: input.infocode
});
