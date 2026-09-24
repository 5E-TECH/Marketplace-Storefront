/**
 * Catch bloklaridagi `caught instanceof Error ? caught.message : "..."` takrorini
 * bitta joyga yig'adi. Bo'sh matnli xatolarda ham xaridorga tushunarli gap qoladi.
 */
export const errorMessage = (cause: unknown, fallback: string): string =>
  cause instanceof Error && cause.message.trim() ? cause.message : fallback;
