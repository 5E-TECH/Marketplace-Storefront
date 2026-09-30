// Intl natijasi Node va brauzerda farq qilishi mumkin. Bu formatterlar SSR va clientda bir xil matn qaytaradi.
export const formatPrice = (value: number): string => {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getUTCFullYear()}`;
};

/**
 * Sana va vaqt Toshkent bo'yicha (UTC+5, yozgi vaqt yo'q): SSR va clientda bir xil matn.
 * Qaytarish tarixi kabi joylarda soat ham kerak — kun almashish chegarasida sana ham to'g'ri chiqadi.
 */
export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const local = new Date(date.getTime() + 5 * 3_600_000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()}, ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
};

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export const formatLongDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]}, ${date.getUTCFullYear()}`;
};
