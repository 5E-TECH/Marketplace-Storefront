"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

type Props = {
  value: number;
  /** Miqdor 1 da turib "−" bosilsa: `remove` mahsulotni savatdan olib tashlaydi. */
  decreaseAction?: "decrease" | "remove";
  max?: number;
  disabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
  testId?: string;
};

/** Mahsulot kartasi, savat qatori va mahsulot sahifasi bitta stepperdan foydalanadi. */
export function QuantityStepper({ value, decreaseAction = "decrease", max, disabled = false, onDecrease, onIncrease, className = "", testId }: Props) {
  const removes = decreaseAction === "remove" && value <= 1;
  return <div className={`quantity ${className}`.trim()} data-testid={testId}>
    <button type="button" disabled={disabled || (!removes && value <= 1)} onClick={onDecrease} aria-label={removes ? "Savatdan olib tashlash" : "Kamaytirish"}>{removes ? <Trash2/> : <Minus/>}</button>
    <b aria-live="polite" aria-label={`${value} ta`}>{value}</b>
    <button type="button" disabled={disabled || (max !== undefined && value >= max)} onClick={onIncrease} aria-label="Ko‘paytirish"><Plus/></button>
  </div>;
}
