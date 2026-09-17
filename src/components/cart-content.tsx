"use client";

import { ShoppingCart, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { groupCartItems } from "@/lib/cart-groups";
import { readCartSelection, saveCartSelection } from "@/lib/cart-selection";
import { useCart } from "@/providers/cart-provider";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";
import { Price } from "./ui";

export function CartContent() {
  const { items, quantity, loading, error, update, remove, clear } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  useEffect(() => {
    if (loading || selectionReady) return;
    setSelectedIds(readCartSelection(items));
    setSelectionReady(true);
  }, [items, loading, selectionReady]);
  useEffect(() => {
    if (!selectionReady) return;
    const available = new Set(items.map((item) => item.id));
    setSelectedIds((current) => {
      const next = current.filter((id) => available.has(id));
      if (next.length !== current.length) saveCartSelection(next);
      return next;
    });
  }, [items, selectionReady]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedItems = useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected]);
  const groups = useMemo(() => groupCartItems(items), [items]);
  const selectedQuantity = useMemo(() => selectedItems.reduce((sum, item) => sum + item.quantity, 0), [selectedItems]);
  const selectedSubtotal = useMemo(() => selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [selectedItems]);
  const originalTotal = useMemo(() => selectedItems.reduce((sum, item) => sum + (item.product.oldPrice ?? item.product.price) * item.quantity, 0), [selectedItems]);
  const setItemSelected = (id: string, checked: boolean) => setSelectedIds((current) => {
    const next = checked ? [...new Set([...current, id])] : current.filter((itemId) => itemId !== id);
    saveCartSelection(next);
    return next;
  });
  const setAllSelected = (checked: boolean) => {
    const next = checked ? items.map((item) => item.id) : [];
    setSelectedIds(next);
    saveCartSelection(next);
  };
  if (loading && !items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (error && !items.length) return <section className="page-empty" role="alert">{error}</section>;
  if (!items.length) return <section className="page-empty"><span><ShoppingCart/></span><h1>Savatchangiz bo‘sh</h1><p>Mahsulot yonidagi “+” tugmasini bosing — tanlovingiz shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Xaridni boshlash</Link></section>;
  return <section className="cart-page">
    {error && <p className="cart-error" role="alert">{error}</p>}
    <div className="page-heading"><div><span>SAVATCHA</span><h1>Savatingiz, <em>{quantity} mahsulot</em></h1></div></div>
    <div className="cart-page-layout"><div className="cart-main">
      <div className="cart-toolbar"><label className="cart-select-all"><input type="checkbox" checked={items.length > 0 && selectedIds.length === items.length} ref={(input) => { if (input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < items.length; }} onChange={(event) => setAllSelected(event.target.checked)}/><span/> <b>Barcha mahsulotlar ({selectedIds.length}/{items.length})</b></label><button disabled={loading} onClick={clear}><Trash2/> Savatni tozalash</button></div>
      <div className="cart-delivery-note"><Truck/><span><b>Yetkazib berish</b><small>Narx va muddat buyurtmani rasmiylashtirishda manzil bo‘yicha hisoblanadi</small></span></div>
      {groups.map((group, index) => <section className="cart-seller-group" data-testid="cart-seller-group" data-shop-id={group.id} key={group.id}><header><div><span>{index + 1}-posilka · Sotuvchi</span><b>{group.name}</b><small>Alohida yetkaziladi</small></div><Price value={group.items.filter((item) => selected.has(item.id)).reduce((sum, item) => sum + item.product.price * item.quantity, 0)}/></header>{group.items.map((item) => <CartItemRow item={item} selected={selected.has(item.id)} onSelect={setItemSelected} onUpdate={update} onRemove={remove} key={item.id}/>)}</section>)}
    </div><CartSummary quantity={selectedQuantity} subtotal={selectedSubtotal} originalTotal={originalTotal}/></div>
  </section>;
}
