"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { Button } from "./primitives";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** So'rov ketayotganda oynani yopib yuborishga yo'l qo'ymaslik uchun false beriladi. */
  dismissible?: boolean;
  className?: string;
};

/**
 * Loyihadagi yagona popup: backdrop, Escape, fokus tuzog'i va scroll lock shu yerda.
 * Yangi dialog kerak bo'lsa shu komponent ustiga qurish kerak, yangi overlay yozilmaydi.
 */
export function Modal({ open, title, description, children, footer, onClose, dismissible = true, className = "" }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => setMounted(true), []);
  useScrollLock(open);
  const close = useCallback(() => { if (dismissible) onClose(); }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      (dialog?.querySelector<HTMLElement>("[data-autofocus]") ?? dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      restoreFocus.current?.focus();
    };
  }, [open]);

  // Tab bosilganda fokus dialog ichida aylanadi: ortdagi sahifaga o'tib ketmaydi.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.stopPropagation(); close(); return; }
    if (event.key !== "Tab") return;
    const targets = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((node) => node.offsetParent !== null);
    if (!targets.length) return;
    const first = targets[0];
    const last = targets[targets.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  };

  if (!mounted || !open) return null;
  return createPortal(
    <div className="modal-layer" onKeyDown={onKeyDown}>
      <div className="modal-backdrop" role="presentation" onClick={close}/>
      <div className={`modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} ref={dialogRef}>
        <header className="modal__head">
          <h2 id={titleId}>{title}</h2>
          {dismissible && <button className="modal__close" type="button" onClick={onClose} aria-label="Yopish"><X/></button>}
        </header>
        {description && <p className="modal__description" id={descriptionId}>{description}</p>}
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Ortga qaytarib bo'lmaydigan amallar (savatni tozalash kabi) shu oyna orqali so'raladi. */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Bekor qilish", tone = "danger", pending = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return <Modal open={open} title={title} description={description} onClose={onCancel} dismissible={!pending} className="modal--confirm" footer={<>
    <Button variant="secondary" onClick={onCancel} disabled={pending}>{cancelLabel}</Button>
    <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={pending} data-autofocus>{confirmLabel}</Button>
  </>}/>;
}
