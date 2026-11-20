/**
 * Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti) — T01:205, holat-matnlari.md {HOURS}.
 * rahmat-3: 21:00 dan keyin yoki 09:00 dan oldin yuborilgan ariza (holat-matnlari.md:505).
 */
export const CALL_START_HOUR = 9;
export const CALL_END_HOUR = 21;

export function tashkentHour(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", hourCycle: "h23" }).format(now));
}

export const isOffHours = (now: Date = new Date()): boolean => {
  const hour = tashkentHour(now);
  return hour < CALL_START_HOUR || hour >= CALL_END_HOUR;
};
