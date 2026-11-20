import type { Metadata } from "next";
import { OpenedLink } from "@/components/opened-link";
import { OrderSteps } from "@/components/order-steps";
import { SiteHeader } from "@/components/site-header";
import { SupportContact } from "@/components/support-contact";
import { ASK, NOT_FOUND } from "@/lib/texts";

export const metadata: Metadata = { title: NOT_FOUND.title };

/** 404-1 · Noma’lum kod (SF-01 TC3). Neytral: qizil va to‘ldirilgan tugma yo‘q. {FOOT} SF-07 da. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page" data-page="404">
        <h1>{NOT_FOUND.title}</h1>
        <p>{NOT_FOUND.body}</p>
        <section className="block"><OpenedLink title={NOT_FOUND.openedLink} /></section>
        <section className="block">
          <h2 className="block__title">{NOT_FOUND.whatToDo}</h2>
          <ol className="steps">
            {NOT_FOUND.steps.map((step) => (
              <li key={step.title}><strong>{step.title}</strong><br /><span className="muted">{step.hint}</span></li>
            ))}
          </ol>
        </section>
        <SupportContact lead={ASK} hoursFirst />
        <OrderSteps title={NOT_FOUND.whenOpened} />
      </main>
    </>
  );
}
