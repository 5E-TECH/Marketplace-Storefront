import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Button, Container, LoadingGrid, StatePanel } from "@/components/ui";
import { mockProducts } from "@/data/mock-products";

export const metadata: Metadata = {
  title: "Storefront komponentlari",
  description: "Elchi Market umumiy storefront komponentlari namuna sahifasi.",
  alternates: { canonical: "/ui-kit" },
};

const colors = [
  { name: "Brand", token: "--color-brand", value: "#e30613" },
  { name: "Matn", token: "--color-ink", value: "#121316" },
  { name: "Yordamchi matn", token: "--color-muted", value: "#686b73" },
  { name: "Fon", token: "--color-surface", value: "#f5f5f6" },
];

export default function UIKitPage() {
  return <main>
    <Container className="ui-kit">
      <header className="ui-kit__intro">
        <span className="ui-kit__eyebrow">STOREFRONT UI</span>
        <h1>Bitta tizim, barcha sahifalar</h1>
        <p>Ranglar, oraliqlar, tugmalar, mahsulot kartalari va holatlar umumiy komponentlardan yig‘ilgan. Yuqoridagi menyu va pastdagi footer ham global layoutdan keladi.</p>
      </header>

      <section className="ui-kit__section" aria-labelledby="colors-title">
        <h2 id="colors-title">Rang tizimi</h2>
        <div className="ui-kit__tokens">{colors.map((color) => <article className="ui-kit__token" key={color.token}>
          <i style={{ background: color.value }}/>
          <span><b>{color.name}</b><small>{color.token}</small></span>
        </article>)}</div>
      </section>

      <section className="ui-kit__section" aria-labelledby="buttons-title">
        <h2 id="buttons-title">Tugmalar</h2>
        <div className="ui-kit__actions">
          <Button>Asosiy tugma</Button>
          <Button variant="secondary">Ikkinchi tugma</Button>
          <Button loading>Yuklanmoqda</Button>
          <Button disabled>Faol emas</Button>
        </div>
      </section>

      <section className="ui-kit__section" aria-labelledby="cards-title">
        <h2 id="cards-title">Mahsulot kartochkasi</h2>
        <div className="products-grid ui-kit__cards">{mockProducts.slice(0, 3).map((product) => <ProductCard product={product} key={product.id}/>)}</div>
      </section>

      <section className="ui-kit__section" aria-labelledby="states-title">
        <h2 id="states-title">Holatlar</h2>
        <div className="ui-kit__states">
          <div className="ui-kit__loading"><LoadingGrid count={2} label="Mahsulotlar yuklanmoqda"/></div>
          <StatePanel compact title="Ro‘yxat hozircha bo‘sh" description="Bu yerda tanlangan mahsulotlar paydo bo‘ladi."/>
          <StatePanel compact kind="error" title="Ma’lumot yuklanmadi" description="Internet aloqasini tekshirib, qayta urinib ko‘ring." action={<Link className="button button--secondary" href="/ui-kit"><RefreshCw/> Qayta urinish</Link>}/>
        </div>
      </section>
    </Container>
  </main>;
}
