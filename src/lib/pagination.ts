export type PaginationItem = number | "ellipsis";

export function paginationItems(totalPages: number, requestedPage: number): PaginationItem[] {
  if (!Number.isSafeInteger(totalPages) || totalPages < 2) return [];
  const current = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), totalPages) : 1;
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (current >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", current, "ellipsis", totalPages];
}
