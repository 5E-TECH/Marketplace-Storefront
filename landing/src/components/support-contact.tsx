import { HOURS, supportPhone } from "@/lib/texts";

/**
 * Aloqa bloki. Tartib holat-matnlari.md dagi kabi:
 * {ASK} — sarlavha, {HOURS}, telefon; xato-1 — «Savol bo‘lsa:», telefon, {HOURS}.
 * Telefon (EQ-05) sozlanmagan bo‘lsa blok umuman chiqmaydi.
 */
export function SupportContact({ lead, hoursFirst }: { lead: string; hoursFirst: boolean }) {
  const phone = supportPhone();
  if (!phone) return null;
  const hours = <p className="muted">{HOURS}</p>;
  const number = <p><a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a></p>;
  return (
    <section className="block" data-block="support">
      <p className="block__title">{lead}</p>
      {hoursFirst ? <>{hours}{number}</> : <>{number}{hours}</>}
    </section>
  );
}
