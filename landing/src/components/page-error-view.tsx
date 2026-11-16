import type { ReactNode } from "react";
import { PAGE_ERROR } from "@/lib/texts";
import { SiteHeader } from "./site-header";
import { SupportContact } from "./support-contact";

/** xato-1 · Sotuvchi sahifasi ochilmadi. Piksel yo‘q, katalog havolasi yo‘q. {FOOT} SF-07 da. */
export function PageErrorView({ retry }: { retry: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="page" data-page="xato">
        <section className="alert alert--error" role="alert">
          <h1>{PAGE_ERROR.title}</h1>
          <p>{PAGE_ERROR.body}</p>
          {retry}
        </section>
        <section className="block">
          <h2 className="block__title">{PAGE_ERROR.orderTitle}</h2>
          <p>{PAGE_ERROR.orderBody}</p>
        </section>
        <SupportContact lead={PAGE_ERROR.question} hoursFirst={false} />
      </main>
    </>
  );
}
