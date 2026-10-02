import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";

type StatePanelProps = {
  kind?: "empty" | "error";
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  /** Panel sahifaning yagona kontenti bo'lsa (bo'sh savatcha va h.k.) sarlavha sahifa h1'i bo'ladi. */
  headingLevel?: 1 | 2;
};

export function StatePanel({ kind = "empty", title, description, action, icon, compact = false, headingLevel = 2 }: StatePanelProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return <section className={`state-panel state-panel--${kind}${compact ? " state-panel--compact" : ""}`} role={kind === "error" ? "alert" : "status"}>
    <span className="state-panel__icon">{icon ?? (kind === "error" ? <AlertCircle/> : <Inbox/>)}</span>
    <Heading>{title}</Heading>
    <p>{description}</p>
    {action && <div className="state-panel__action">{action}</div>}
  </section>;
}

/**
 * Skeleton mahsulot kartasi shaklini takrorlaydi (rasm + ikki qator matn + narx),
 * shuning uchun haqiqiy kontent kelganda sahifa sakramaydi.
 */
export function LoadingGrid({ count = 4, label = "Yuklanmoqda" }: { count?: number; label?: string }) {
  return <div className="loading-grid" role="status" aria-live="polite" aria-label={label}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => <div className="loading-card" aria-hidden key={index}>
      <i className="loading-card__image"/>
      <i className="loading-card__line"/>
      <i className="loading-card__line loading-card__line--short"/>
      <i className="loading-card__price"/>
    </div>)}
  </div>;
}
