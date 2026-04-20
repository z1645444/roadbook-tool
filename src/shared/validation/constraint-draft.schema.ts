import { DateTime } from 'luxon';
import { z } from 'zod';

import type { ConstraintDraft } from '../../constraints/constraint-draft.model';
import { parseRideWindow } from '../time/time-window.parser';

const canonicalPointSchema = z.object({
  provider: z.literal('amap'),
  providerId: z.string().min(1),
  name: z.string().min(1),
  lng: z.number().finite(),
  lat: z.number().finite(),
  confidence: z.number().min(0).max(1)
});

const pointSlotSchema = z
  .object({
    raw: z.string().min(1),
    status: z.enum(['missing', 'accepted', 'ambiguous']),
    normalized: canonicalPointSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'accepted' && !value.normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'accepted point slot must include normalized value'
      });
    }
  });

const waypointSlotSchema = z
  .object({
    raw: z.string().min(1),
    status: z.enum(['accepted', 'ambiguous']),
    normalized: canonicalPointSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'accepted' && !value.normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'accepted waypoint must include normalized value'
      });
    }
  });

const normalizedDateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  })
  .refine(
    (value) =>
      DateTime.fromISO(value.startDate, { zone: 'local' }) <=
      DateTime.fromISO(value.endDate, { zone: 'local' }),
    {
      message: 'startDate must be before or equal to endDate'
    }
  );

const normalizedRideWindowSchema = z.object({
  start: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  minutes: z.number().int().positive()
});

export const constraintDraftSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  slots: z.object({
    origin: pointSlotSchema.optional(),
    destination: pointSlotSchema.optional(),
    waypoints: z.array(waypointSlotSchema),
    dateRange: z
      .object({
        raw: z.string().min(1),
        normalized: normalizedDateRangeSchema.optional()
      })
      .optional(),
    tripDays: z
      .object({
        raw: z.string().min(1),
        normalized: z.number().int().positive().optional()
      })
      .optional(),
    rideWindow: z
      .object({
        raw: z.string().min(1),
        normalized: normalizedRideWindowSchema.optional()
      })
      .optional(),
    intensity: z
      .object({
        raw: z.string().min(1),
        normalized: z.enum(['easy', 'standard', 'challenge']).optional()
      })
      .optional()
  }),
  assumptions: z.record(z.string(), z.string()).optional(),
  revisionLog: z.array(
    z.object({
      field: z.string().min(1),
      turnId: z.string().min(1),
      timestampIso: z.string().datetime({ offset: true })
    })
  )
});

const DATE_RANGE_PATTERNS = [
  /^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i,
  /^(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})$/,
  /^(\d{4}-\d{2}-\d{2})\s+-\s+(\d{4}-\d{2}-\d{2})$/
];

const parseIsoDate = (value: string): string => {
  const parsed = DateTime.fromISO(value, { zone: 'local' });
  if (!parsed.isValid) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return parsed.toISODate() ?? value;
};

export const normalizeDateRange = (
  raw: string
): { startDate: string; endDate: string } => {
  for (const pattern of DATE_RANGE_PATTERNS) {
    const match = raw.match(pattern);
    if (!match) {
      continue;
    }

    const startDate = parseIsoDate(match[1]);
    const endDate = parseIsoDate(match[2]);

    if (startDate > endDate) {
      throw new Error('Date range is invalid: start date must be before end date');
    }

    return { startDate, endDate };
  }

  throw new Error('Date range must match YYYY-MM-DD to YYYY-MM-DD');
};

export const normalizeRideWindow = (raw: string) => parseRideWindow(raw).normalized;

export const safeParseConstraintDraft = (payload: unknown) =>
  constraintDraftSchema.safeParse(payload) as z.ZodSafeParseResult<ConstraintDraft>;
