import { z } from 'zod';

import { routePointSchema, routeSegmentSchema } from './route-artifact.schema';

const lodgingEntrySchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['hostel', 'guesthouse', 'hotel']),
  distanceMeters: z.number().nonnegative(),
  rating: z.number().finite().nullable(),
  priceCny: z.number().finite().nullable(),
  policyStage: z.enum(['strict', 'radius_12km', 'radius_20km', 'price_relaxed_20'])
});

const dayLodgingSchema = z.object({
  policyStatus: z.enum(['compliant', 'relaxed', 'no_match']),
  fallbackTrace: z.array(z.string()),
  categories: z.object({
    hostel: z.array(lodgingEntrySchema).max(3),
    guesthouse: z.array(lodgingEntrySchema).max(3),
    hotel: z.array(lodgingEntrySchema).max(3)
  })
});

export const dayBoundarySchema = z.object({
  dayIndex: z.number().int().positive(),
  startPoint: routePointSchema,
  endPoint: routePointSchema,
  overnightStopPoint: routePointSchema.nullable()
});

export const multidayDayStageSchema = dayBoundarySchema.extend({
  totalDistanceMeters: z.number().nonnegative(),
  totalDurationSeconds: z.number().nonnegative(),
  segments: z.array(routeSegmentSchema),
  lodging: dayLodgingSchema.nullable().optional()
});

export const multidayTotalsSchema = z.object({
  totalDistanceMeters: z.number().nonnegative(),
  totalDurationSeconds: z.number().nonnegative()
});

export const multidayRouteArtifactSchema = z.object({
  optimizedPoints: z.array(routePointSchema).min(2),
  days: z.array(multidayDayStageSchema),
  totals: multidayTotalsSchema
});

export type MultidayRouteArtifact = z.infer<typeof multidayRouteArtifactSchema>;

export const safeParseMultidayRouteArtifact = (payload: unknown) =>
  multidayRouteArtifactSchema.safeParse(payload);
