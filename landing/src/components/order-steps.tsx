import { ARIZA, STEPS } from "@/lib/texts";

/** «To‘g‘ri havola ochilganda», {ARIZA}, {STEPS} — 404-1 va 404-2 ning pastki qismi. */
export function OrderSteps({ title }: { title: string }) {
  return (
    <section className="block">
      <h2 className="block__title">{title}</h2>
      <p>{ARIZA}</p>
      <ol className="steps">{STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
    </section>
  );
}
