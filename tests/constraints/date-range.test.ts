import { describe, expect, it } from 'vitest';

import {
  normalizeDateRange,
  safeParseConstraintDraft
} from '../../src/shared/validation/constraint-draft.schema';

describe('CONV-03 date range normalization', () => {
  it('should normalize valid ranges to local iso dates', () => {
    const normalized = normalizeDateRange('2026-05-01 to 2026-05-07');

    expect(normalized).toEqual({
      startDate: '2026-05-01',
      endDate: '2026-05-07'
    });
  });

  it('should reject invalid date order', () => {
    expect(() => normalizeDateRange('2026-05-07 to 2026-05-01')).toThrow(
      /start date must be before end date/i
    );
  });

  it('should preserve raw and normalized values in canonical draft schema', () => {
    const parsed = safeParseConstraintDraft({
      id: 'draft-1',
      sessionId: 'session-1',
      slots: {
        waypoints: [],
        dateRange: {
          raw: '2026-05-01 to 2026-05-07',
          normalized: {
            startDate: '2026-05-01',
            endDate: '2026-05-07'
          }
        },
        tripDays: {
          raw: '7',
          normalized: 7
        }
      },
      revisionLog: []
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.slots.dateRange?.raw).toBe('2026-05-01 to 2026-05-07');
    expect(parsed.data.slots.dateRange?.normalized?.startDate).toBe('2026-05-01');
    expect(parsed.data.slots.tripDays?.raw).toBe('7');
    expect(parsed.data.slots.tripDays?.normalized).toBe(7);
  });
});
