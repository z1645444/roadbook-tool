import { z } from 'zod';

export const routePointSchema = z.object({
  providerId: z.string().min(1),
  name: z.string().min(1),
  lng: z.number().finite(),
  lat: z.number().finite()
});

export const routeSegmentSchema = z.object({
  from: routePointSchema,
  to: routePointSchema,
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  polyline: z.array(
    z.object({
      lng: z.number().finite(),
      lat: z.number().finite()
    })
  )
});

export const routeArtifactSchema = z.object({
  segments: z.array(routeSegmentSchema),
  totalDistanceMeters: z.number().nonnegative(),
  totalDurationSeconds: z.number().nonnegative()
});

export type RouteArtifact = z.infer<typeof routeArtifactSchema>;

export const safeParseRouteArtifact = (payload: unknown) =>
  routeArtifactSchema.safeParse(payload);
