import type { Metadata } from "next";
import { StorefrontHome } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";
import { bannerService } from "@/services/banner.service";
import { absoluteUrl, baseOpenGraph, defaultOpenGraphImages, jsonLd, listingSeo, SITE_NAME, siteUrl } from "@/lib/seo";

type Props = { searchParams: Promise<CatalogSearchParams> };

const description = "Elchi Market — O‘zbekistondagi do‘konlarning mahsulotlari bitta joyda. Elektronika, kiyim, uy-ro‘zg‘or va oziq-ovqatni toping, buyurtma bering, uyingizgacha yetkazib beramiz.";

/**
 * Next bosh sahifa ("/") canonical'idan so'rov qismini tashlab yuboradi, shuning uchun
 * 2-sahifa va undan keyingilarida canonical sahifaning o'zida <link> bilan beriladi.
 */
const ownPageCanonical = (params: CatalogSearchParams): string | undefined => {
  const seo = listingSeo("/", params);
  const canonical = seo.alternates?.canonical;
  return !seo.robots && typeof canonical === "string" && canonical.includes("?page=") ? canonical : undefined;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const { alternates, ...seo } = listingSeo("/", params);
  return { title: { absolute: "Elchi Market — O‘zbekistondagi onlayn marketplace" }, description, ...seo, ...(ownPageCanonical(params) ? {} : { alternates }), openGraph: { ...baseOpenGraph, title: "Elchi Market — onlayn marketplace", description, url: "/", images: defaultOpenGraphImages } };
}

const organizationLd = [
  { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: siteUrl(), logo: absoluteUrl("/icon.png") },
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: siteUrl(), inLanguage: "uz", potentialAction: { "@type": "SearchAction", target: `${siteUrl()}/qidiruv?q={search_term_string}`, "query-input": "required name=search_term_string" } },
];

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);
  const [catalog, featuredShops, banners] = await Promise.all([productService.list(query), productService.featuredShops(), bannerService.list()]);
  const canonical = ownPageCanonical(params);
  return <>{canonical && <link rel="canonical" href={canonical}/>}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationLd) }}/><StorefrontHome query={query} catalog={catalog} featuredShops={featuredShops} banners={banners.data}/></>;
}
