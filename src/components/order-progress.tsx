import { Check, CheckCircle2, Package, Truck, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types/commerce";
import type { TrackingStep } from "@/services/order-tracking.service";

const steps = [
  { key: "received", label: "Qabul qilindi", icon: CheckCircle2 },
  { key: "preparing", label: "Yig‘ilmoqda", icon: Package },
  { key: "on_the_way", label: "Yo‘lda", icon: Truck },
  { key: "delivered", label: "Yetkazildi", icon: Check },
] as const;

export function OrderProgress({ step, status }: { step: TrackingStep; status: OrderStatus }) {
  const terminal = step === "cancelled" || step === "returned";
  const currentIndex = steps.findIndex((item) => item.key === step);
  return <div className={`tracking-progress${terminal ? " tracking-progress--terminal" : ""}`} aria-label="Buyurtma bosqichlari">
    {terminal
      ? <div className="tracking-terminal"><XCircle/><b>{status}</b><small>Qo‘shimcha ma’lumot uchun qo‘llab-quvvatlash xizmatiga murojaat qiling.</small></div>
      : steps.map(({ key, label, icon: Icon }, itemIndex) => <div className={itemIndex <= currentIndex ? "is-complete" : ""} aria-current={itemIndex === currentIndex ? "step" : undefined} key={key}><span><Icon/></span><b>{label}</b></div>)}
  </div>;
}
