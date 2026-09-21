"use client";

import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  onChange: (option: SelectOption | null) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
};

const normalize = (value: string) => value.toLocaleLowerCase("uz").trim();

/**
 * Qidiruvli combobox: native `select` o'rniga ishlatiladi.
 * Ko'rinadigan matn `name` bilan formada qoladi, shuning uchun autofill va
 * "label yozib tanlash" (masalan avtotest yoki brauzer autofill) ham ishlaydi.
 */
export function SelectField({ label, name, value, options, onChange, placeholder, disabled = false, loading = false, required = false, autoComplete, className = "" }: Props) {
  const selected = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLLabelElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const visible = useMemo(() => {
    const key = normalize(query);
    return key ? options.filter((option) => normalize(option.label).includes(key)) : options;
  }, [options, query]);
  const text = open ? query : selected?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const commit = (option: SelectOption | null) => {
    onChange(option);
    setQuery("");
    setOpen(false);
  };
  // Label to'liq yozilganda (autofill yoki nusxa-ko'chirish) darhol tanlanadi.
  const change = (next: string) => {
    setQuery(next);
    setActive(0);
    setOpen(true);
    const exact = options.find((option) => normalize(option.label) === normalize(next));
    if (exact) commit(exact);
    else if (!next && selected) onChange(null);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => visible.length ? (current + step + visible.length) % visible.length : 0);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (visible[active]) commit(visible[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery("");
      setOpen(false);
    } else if (event.key === "Tab") {
      setQuery("");
      setOpen(false);
    }
  };

  return <label className={`select-field ${className}`.trim()} ref={rootRef}>
    <span className="select-field__label">{label}</span>
    <div className={`select-field__control${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}>
      {open ? <Search aria-hidden/> : null}
      <input
        name={name}
        value={text}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => !disabled && setOpen(true)}
        onBlur={() => { setQuery(""); setOpen(false); }}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        placeholder={loading ? "Yuklanmoqda…" : placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && visible[active] ? `${listId}-${visible[active].value}` : undefined}
      />
      {loading ? <LoaderCircle className="select-field__spinner" aria-hidden/> : <ChevronDown className="select-field__caret" aria-hidden/>}
    </div>
    {open && <ul className="select-field__list" id={listId} role="listbox" aria-label={label} ref={listRef}>
      {visible.length ? visible.map((option, index) => <li
        key={option.value}
        id={`${listId}-${option.value}`}
        role="option"
        aria-selected={option.value === value}
        className={`${index === active ? "is-active" : ""} ${option.value === value ? "is-selected" : ""}`.trim()}
        onMouseEnter={() => setActive(index)}
        onMouseDown={(event) => { event.preventDefault(); commit(option); }}
      >{option.label}{option.value === value && <Check aria-hidden/>}</li>) : <li className="select-field__empty" role="presentation">Mos variant topilmadi</li>}
    </ul>}
  </label>;
}
