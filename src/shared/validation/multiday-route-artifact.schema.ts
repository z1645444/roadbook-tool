import { z } from 'zod';

import { routePointSchema, routeSegmentSchema } from './route-artifact.schema';

export const dayBoundarySchema = z.object({
  dayIndex: z.number().int().positive(),
  startPoint: routePointSchema,
  endPoint: routePointSchema,
  overnightStopPoint: routePointSchema.nullable()
});

export const multidayDayStageSchema = dayBoundarySchema.extend({
  totalDistanceMeters: z.number().nonnegative(),
  totalDurationSeconds: z.number().nonnegative(),
  segments: z.array(routeSegmentSchema)
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
