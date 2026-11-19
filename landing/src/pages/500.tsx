import Head from "next/head";
import { PageErrorView } from "@/components/page-error-view";
import { PAGE_ERROR } from "@/lib/texts";

/**
 * xato-1 (SF-03): statik sotuvchi sahifasi hali yasalmagan paytda backend javob bermasa, sahifa xato tashlaydi
 * (xato sahifasi statik keshga yozilmasin — `app/v/[variant]/[code]/page.tsx`) va Next shu 500 sahifani beradi.
 * Statik HTML, JS siz ham ko‘rinadi; «Qayta urinish» — o‘sha manzilni qayta ochadi. Piksel yo‘q.
 */
export default function ServerError() {
  return (
    <>
      <Head>
        <title>{`${PAGE_ERROR.title} | Elchi Market`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <PageErrorView retry={<a className="button button--secondary" href="">{PAGE_ERROR.retry}</a>} />
    </>
  );
}
