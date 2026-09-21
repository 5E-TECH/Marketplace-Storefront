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

const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export const formatLongDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]}, ${date.getUTCFullYear()}`;
};
