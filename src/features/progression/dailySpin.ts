/** One real spin per LOCAL calendar day, including after refresh or reopening the modal. */
export function localDayKey(time: number): string {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function canSpinToday(lastSpinTime: number | undefined, now: number = Date.now()): boolean {
  return !lastSpinTime || localDayKey(lastSpinTime) !== localDayKey(now);
}
export function millisecondsUntilNextDay(now: number = Date.now()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now);
}
export function spinGuardKey(playerId: string): string {
  return `viet_loto_daily_wheel_${playerId}`;
}
