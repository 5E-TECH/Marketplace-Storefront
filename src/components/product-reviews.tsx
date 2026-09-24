"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getAccessToken } from "@/lib/access-token";
import { formatLongDate } from "@/lib/format";
import { reviewService } from "@/services/review.service";
import type { ProductReviewsResult, ReviewableOrderItem } from "@/types/commerce";
import { Button, StatePanel } from "./ui";
import { errorMessage } from "@/lib/errors";

export function ProductReviews({ productId, reviews }: { productId: string | number; reviews: ProductReviewsResult }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [eligible, setEligible] = useState<ReviewableOrderItem[]>([]);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const signedIn = Boolean(getAccessToken());
      if (!active) return;
      setAuthenticated(signedIn);
      if (!signedIn) { setEligibilityLoading(false); return; }
      try {
        const items = await reviewService.reviewableItems(productId);
        if (!active) return;
        setEligible(items);
        setSelectedItem(items[0]?.orderItemId ?? "");
      } catch (error) {
        if (active) setEligibilityError(errorMessage(error, "Xarid ma’lumotini tekshirib bo‘lmadi"));
      } finally { if (active) setEligibilityLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [productId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!selectedItem || score < 1) { setFormError("Baho tanlang"); return; }
    setSubmitting(true);
    try {
      await reviewService.create(productId, { orderItemId: selectedItem, rating: score, comment });
      setSubmitted(true);
      setEligible((items) => items.filter((item) => item.orderItemId !== selectedItem));
      setComment("");
      setScore(0);
      router.refresh();
    } catch (error) {
      setFormError(errorMessage(error, "Sharhni yuborib bo‘lmadi"));
    } finally { setSubmitting(false); }
  };

  const basePath = `/product/${encodeURIComponent(String(productId))}`;
  return <section className="reviews-section" id="reviews" aria-labelledby="reviews-title">
    <div className="reviews-heading">
      <div><span className="reviews-score"><Star fill="currentColor" aria-hidden/> {reviews.rating.toFixed(1)}</span><div><h2 id="reviews-title">Xaridorlar sharhlari</h2><p>{reviews.total} ta sharh</p></div></div>
    </div>

    {reviews.error ? <StatePanel kind="error" compact title="Sharhlarni yuklab bo‘lmadi" description={reviews.error}/> : reviews.items.length ? <div className="reviews-list">
      {reviews.items.map((review) => <article key={review.id}>
        <header><b>{review.authorName}</b><time dateTime={review.createdAt}>{formatLongDate(review.createdAt)}</time></header>
        <div className="review-stars" aria-label={`${review.rating} yulduz`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} fill={index < review.rating ? "currentColor" : "none"}/>)}</div>
        {review.comment && <p>{review.comment}</p>}
      </article>)}
    </div> : <StatePanel compact title="Hali sharhlar yo‘q" description="Bu mahsulot haqida birinchi bo‘lib fikr qoldiring."/>}

    {!reviews.error && reviews.totalPages > 1 && <nav className="reviews-pagination" aria-label="Sharhlar sahifalari">
      {reviews.page > 1 ? <Link className="button button--secondary" href={`${basePath}?reviewPage=${reviews.page - 1}#reviews`}>← Oldingi</Link> : <span/>}
      <b>{reviews.page} / {reviews.totalPages}</b>
      {reviews.page < reviews.totalPages ? <Link className="button button--secondary" href={`${basePath}?reviewPage=${reviews.page + 1}#reviews`}>Keyingi →</Link> : <span/>}
    </nav>}

    <div className="review-form-card">
      <h3>Mahsulotni baholang</h3>
      {eligibilityLoading ? <p role="status">Xarid ma’lumoti tekshirilmoqda…</p> : eligibilityError ? <p className="form-error" role="alert">{eligibilityError}</p> : submitted ? <p className="form-success" role="status">Sharhingiz qabul qilindi.</p> : !authenticated ? <p>Sharh yozish uchun <Link href={`/login?next=${encodeURIComponent(`${basePath}#reviews`)}`}>akkauntingizga kiring</Link>. Faqat yetkazilgan mahsulotga sharh yozish mumkin.</p> : !eligible.length ? <p>Bu mahsulot sizga yetkazilgach sharh qoldira olasiz.</p> : <form onSubmit={submit}>
        {eligible.length > 1 && <label>Buyurtma<select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>{eligible.map((item) => <option value={item.orderItemId} key={item.orderItemId}>#{item.orderId}</option>)}</select></label>}
        <fieldset><legend>Bahoyingiz</legend><div className="review-rating-input">{[1, 2, 3, 4, 5].map((value) => <button type="button" aria-label={`${value} yulduz`} aria-pressed={score === value} onClick={() => setScore(value)} key={value}><Star fill={value <= score ? "currentColor" : "none"}/></button>)}</div></fieldset>
        <label>Fikringiz<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} placeholder="Mahsulot haqidagi fikringiz (ixtiyoriy)"/></label>
        {formError && <p className="form-error" role="alert">{formError}</p>}
        <Button type="submit" loading={submitting}>Sharhni yuborish</Button>
      </form>}
    </div>
  </section>;
}
