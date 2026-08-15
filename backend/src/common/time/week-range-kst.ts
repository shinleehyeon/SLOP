/** Returns [Monday 00:00 KST, now] as UTC Date instances. */
export function getCurrentWeekRangeKst(now = new Date()): { start: Date; end: Date } {
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffsetMs);
  const day = kstNow.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const mondayUtcMidnightAsKst = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate() - daysFromMonday,
    0,
    0,
    0,
    0,
  );
  const start = new Date(mondayUtcMidnightAsKst - kstOffsetMs);

  return { start, end: now };
}
