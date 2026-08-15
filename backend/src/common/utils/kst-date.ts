const KST_TIME_ZONE = 'Asia/Seoul';

export function getKstDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: KST_TIME_ZONE }).format(date);
}

/** Seconds from `date` until next midnight in KST. Minimum 60. */
export function getSecondsUntilKstMidnight(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIME_ZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const second = Number(parts.find((part) => part.type === 'second')?.value ?? 0);

  const elapsed = hour * 3600 + minute * 60 + second;
  return Math.max(60, 86400 - elapsed);
}
