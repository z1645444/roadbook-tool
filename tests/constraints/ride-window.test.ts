import { describe, expect, it } from 'vitest';

import { parseRideWindow } from '../../src/shared/time/time-window.parser';
import { safeParseConstraintDraft } from '../../src/shared/validation/constraint-draft.schema';

describe('CONV-04 ride window parser', () => {
  it('should accept strict HH:mm-HH:mm windows', () => {
    const parsed = parseRideWindow('08:00-17:00');

    expect(parsed.normalized).toEqual({
      start: '08:00',
      end: '17:00',
      minutes: 540
    });
  });

  it('should reject malformed windows', () => {
    expect(() => parseRideWindow('8:00-17:00')).toThrow(/strict HH:mm-HH:mm/i);
  });

  it('should reject semantically invalid windows where end is not later', () => {
    expect(() => parseRideWindow('17:00-08:00')).toThrow(/end must be later than start/i);
  });

  it('should require normalized point values when acceptance is claimed', () => {
    const result = safeParseConstraintDraft({
      id: 'draft-2',
      sessionId: 'session-2',
      slots: {
        origin: {
          raw: '杭州西湖',
          status: 'accepted'
        },
        waypoints: [],
        rideWindow: {
          raw: '08:00-17:00',
          normalized: {
            start: '08:00',
            end: '17:00',
            minutes: 540
          }
        }
      },
      revisionLog: []
    });

    expect(result.success).toBe(false);
  });
});
