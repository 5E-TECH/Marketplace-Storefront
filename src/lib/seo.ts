const fallbackUrl = "http://localhost:3001";

export const siteUrl = (): string => {
  const raw = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().replace(/\/+$/, "") : fallbackUrl;
  } catch { return fallbackUrl; }
};

export const absoluteUrl = (path: string): string => new URL(path, `${siteUrl()}/`).toString();
export const defaultOpenGraphImages = [{ url: absoluteUrl("/og-default.png"), width: 1200, height: 630, alt: "Elchi Market" }];
export const jsonLd = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");
