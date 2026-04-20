import { DateTime } from 'luxon';

export interface ParsedRideWindow {
  raw: string;
  normalized: {
    start: string;
    end: string;
    minutes: number;
  };
}

const RIDE_WINDOW_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d-(?:[01]\d|2[0-3]):[0-5]\d$/;

const parseClock = (value: string): DateTime => {
  const parsed = DateTime.fromFormat(value, 'HH:mm', { zone: 'local' });
  if (!parsed.isValid) {
    throw new Error(`Invalid time token: ${value}`);
  }
  return parsed;
};

export const parseRideWindow = (input: string): ParsedRideWindow => {
  if (!RIDE_WINDOW_PATTERN.test(input)) {
    throw new Error('Ride window must match strict HH:mm-HH:mm format');
  }

  const [startToken, endToken] = input.split('-');
  const start = parseClock(startToken);
  const end = parseClock(endToken);

  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const minutes = endMinutes - startMinutes;

  if (minutes <= 0) {
    throw new Error('Ride window end must be later than start');
  }

  return {
    raw: input,
    normalized: {
      start: start.toFormat('HH:mm'),
      end: end.toFormat('HH:mm'),
      minutes
    }
  };
};
