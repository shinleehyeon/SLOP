import { describe, expect, test } from 'bun:test';
import { getCurrentWeekRangeKst } from './week-range-kst';

describe('getCurrentWeekRangeKst', () => {
  test('week starts on Monday 00:00 KST', () => {
    // 2026-07-17 01:00 KST = 2026-07-16 16:00 UTC (Friday)
    const now = new Date('2026-07-16T16:00:00.000Z');
    const { start, end } = getCurrentWeekRangeKst(now);

    expect(end.toISOString()).toBe(now.toISOString());
    // Monday 2026-07-13 00:00 KST = 2026-07-12 15:00 UTC
    expect(start.toISOString()).toBe('2026-07-12T15:00:00.000Z');
  });
});
