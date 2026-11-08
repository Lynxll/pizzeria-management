import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, getOrderItems, getReviews, createReview } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import cheeseIcon from "@/assets/icons8-сыр-64.png";
import pizzaIcon from "@/assets/icons8-пицца-64.png";
import tomatoIcon from "@/assets/icons8-tomato-64.png";
import mushroomIcon from "@/assets/icons8-mushroom-64.png";

function StarRating({ value = 5, onChange }) {
  return (
    <div className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`${n <= value ? "text-yellow-500" : "text-neutral-300"} text-2xl leading-none`}
          aria-label={`Оценка ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReadonlyStars({ value = 0 }) {
  const safeValue = Number(value) || 0;
  return (
    <div className="inline-flex gap-0.5" aria-label={`Оценка: ${safeValue} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`${n <= safeValue ? "text-yellow-500" : "text-neutral-300"} text-lg leading-none`}>
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewModal({ open, orderId, onClose, onSubmitted }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const createMut = useMutation({
    mutationFn: (payload) => createReview(payload),
    onSuccess: async () => {

      await qc.invalidateQueries({ queryKey: ["reviews", orderId] });
      onSubmitted?.();
      onClose?.();
    },
  });

  if (!open) return null;

  const submit = () =>
    createMut.mutate({ order_id: Number(orderId), rating, comment: comment.trim() || null });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="relative w-full max-w-md space-y-3 overflow-hidden rounded-2xl border border-[#FDE68A] bg-[#FFFDF5] p-5 shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 22%, rgba(120, 53, 15, 0.045), transparent 32%),
              radial-gradient(circle at 80% 75%, rgba(217, 119, 6, 0.04), transparent 35%),
              repeating-linear-gradient(
                22deg,
                rgba(28, 25, 23, 0.014) 0px,
                rgba(28, 25, 23, 0.014) 1px,
                transparent 1px,
                transparent 5px
              )
            `,
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-multiply" style={{ backgroundImage: "repeating-radial-gradient(circle at 0 0, rgba(41,37,36,0.02) 0px, rgba(41,37,36,0.02) 1px, transparent 1px, transparent 3px)", backgroundSize: "3px 3px" }} aria-hidden />
        <div className="relative z-10 space-y-3">
        <h3 className="text-lg font-semibold text-[#1C1917]">Отзыв о заказе №{orderId}</h3>

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm text-[#9C8F80]">Оценка:</span>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <textarea
          className="min-h-[100px] w-full rounded-xl border border-[#FDE68A] bg-white p-2.5 text-[#1C1917] outline-none focus:border-[#F59E0B]"
          placeholder="Пара слов о заказе…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            className="rounded-lg border border-[#BFDBFE] bg-[#93C5FD] px-3 py-1 text-white hover:bg-[#7EB7FA]"
            onClick={onClose}
            disabled={createMut.isLoading}
          >
            Назад
          </button>
          <button
            className="rounded-lg bg-[#F87171] px-3 py-1 text-white hover:bg-[#EF4444] disabled:opacity-50"
            onClick={submit}
            disabled={createMut.isLoading}
          >
            Отправить
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_MAP = {
  0: "принят",
  1: "готовится",
  2: "в пути",
  3: "доставлен",
  4: "отменен",
  Assigned: "назначен",
  InProgress: "в пути",
  Delivered: "доставлен",
  Cancelled: "отменен",
  Ready: "готов",
};

const pendingReviewKey = (orderId) => `pending-review:${orderId}`;

const ORDER_BG_SWIRLS = [
  { x: "8%", y: "18%", color: "#5B21B6", rotate: "-12deg", scale: 1.1, variant: "complex" },
  { x: "22%", y: "14%", color: "#EAB308", rotate: "-6deg", scale: 0.78, variant: "cheese" },
  { x: "38%", y: "12%", color: "#EAB308", rotate: "11deg", scale: 0.8, variant: "pizza" },
  { x: "54%", y: "17%", color: "#DC2626", rotate: "8deg", scale: 0.78, variant: "tomato" },
  { x: "70%", y: "14%", color: "#B88746", rotate: "-12deg", scale: 0.76, variant: "mushroom" },
  { x: "86%", y: "20%", color: "#7C3AED", rotate: "13deg", scale: 1.05, variant: "double" },
  { x: "11%", y: "46%", color: "#EF4444", rotate: "-10deg", scale: 0.82, variant: "single" },
  { x: "29%", y: "42%", color: "#EAB308", rotate: "15deg", scale: 0.76, variant: "cheese" },
  { x: "44%", y: "50%", color: "#EAB308", rotate: "-9deg", scale: 0.74, variant: "pizza" },
  { x: "61%", y: "45%", color: "#4C1D95", rotate: "10deg", scale: 0.92, variant: "double" },
  { x: "77%", y: "51%", color: "#DC2626", rotate: "-8deg", scale: 0.76, variant: "tomato" },
  { x: "91%", y: "46%", color: "#B88746", rotate: "12deg", scale: 0.75, variant: "mushroom" },
  { x: "35%", y: "36%", color: "#EAB308", rotate: "-11deg", scale: 0.72, variant: "cheese" },
  { x: "49%", y: "38%", color: "#EAB308", rotate: "14deg", scale: 0.74, variant: "pizza" },
  { x: "9%", y: "78%", color: "#F43F5E", rotate: "-11deg", scale: 0.95, variant: "single" },
  { x: "27%", y: "84%", color: "#EAB308", rotate: "7deg", scale: 0.8, variant: "cheese" },
  { x: "46%", y: "88%", color: "#EAB308", rotate: "-15deg", scale: 0.78, variant: "pizza" },
  { x: "63%", y: "82%", color: "#6366F1", rotate: "13deg", scale: 1.02, variant: "complex" },
  { x: "81%", y: "86%", color: "#DC2626", rotate: "-10deg", scale: 0.78, variant: "tomato" },
  { x: "93%", y: "80%", color: "#B88746", rotate: "11deg", scale: 0.74, variant: "mushroom" },
  { x: "73%", y: "74%", color: "#EAB308", rotate: "-9deg", scale: 0.72, variant: "cheese" },
  { x: "57%", y: "74%", color: "#DC2626", rotate: "10deg", scale: 0.72, variant: "tomato" },
];

function WarmPaperBackground({ children }) {
  return (
    <div className="relative isolate min-h-screen bg-[#F9F6EF]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,252,0.72) 0%, rgba(249,246,239,0.45) 42%, rgba(245,236,223,0.72) 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-65"
        style={{
          backgroundImage: `
            radial-gradient(circle at 14% 22%, rgba(120, 53, 15, 0.06), transparent 30%),
            radial-gradient(circle at 81% 78%, rgba(217, 119, 6, 0.055), transparent 33%),
            radial-gradient(circle at 57% 41%, rgba(146, 64, 14, 0.04), transparent 36%),
            radial-gradient(circle at 37% 73%, rgba(120, 53, 15, 0.032), transparent 24%),
            radial-gradient(circle at 72% 26%, rgba(217, 119, 6, 0.028), transparent 20%),
            repeating-linear-gradient(
              23deg,
              rgba(28, 25, 23, 0.018) 0px,
              rgba(28, 25, 23, 0.018) 1px,
              transparent 1px,
              transparent 5px
            )
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-4 mix-blend-multiply"
        style={{
          backgroundImage: `
            repeating-radial-gradient(
              circle at 0 0,
              rgba(41, 37, 36, 0.028) 0px,
              rgba(41, 37, 36, 0.028) 1px,
              transparent 1px,
              transparent 3px
            ),
            repeating-radial-gradient(
              circle at 100% 100%,
              rgba(120, 53, 15, 0.018) 0px,
              rgba(120, 53, 15, 0.018) 1px,
              transparent 1px,
              transparent 4px
            )
          `,
          backgroundSize: "3px 3px, 5px 5px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-16"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1200'%3E%3Cpath d='M-20 170 C 180 120, 350 250, 560 190 C 780 125, 1000 235, 1240 170 C 1390 130, 1500 165, 1640 145' stroke='%236366F1' stroke-opacity='0.23' stroke-width='4' fill='none'/%3E%3Cpath d='M-40 280 C 140 340, 330 230, 520 285 C 730 345, 930 235, 1140 292 C 1320 340, 1480 260, 1640 310' stroke='%23DC2626' stroke-opacity='0.2' stroke-width='4' fill='none'/%3E%3Cpath d='M-30 430 C 220 370, 420 490, 640 435 C 860 385, 1100 510, 1310 445 C 1450 405, 1540 435, 1640 420' stroke='%235B21B6' stroke-opacity='0.18' stroke-width='3.5' fill='none'/%3E%3Cpath d='M-60 610 C 140 680, 330 540, 520 610 C 700 675, 920 560, 1100 620 C 1310 690, 1490 575, 1650 640' stroke='%23B91C1C' stroke-opacity='0.19' stroke-width='4' fill='none'/%3E%3Cpath d='M-20 790 C 170 735, 370 850, 600 790 C 820 735, 1040 855, 1270 800 C 1430 760, 1520 800, 1640 775' stroke='%234C1D95' stroke-opacity='0.17' stroke-width='3.5' fill='none'/%3E%3Cpath d='M-50 980 C 150 1035, 360 930, 580 985 C 800 1040, 1010 930, 1230 990 C 1410 1040, 1520 960, 1640 1015' stroke='%23EF4444' stroke-opacity='0.16' stroke-width='3.5' fill='none'/%3E%3C/svg%3E\")",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      {ORDER_BG_SWIRLS.map((swirl, idx) => (
        <div
          key={`order-swirl-${idx}`}
          className="pointer-events-none fixed z-[1]"
          style={{
            top: swirl.y,
            left: swirl.x,
            transform: `rotate(${swirl.rotate}) scale(${swirl.scale})`,
            opacity: 0.2,
            filter:
              idx % 3 === 0
                ? "drop-shadow(0 1px 3px rgba(76, 29, 149, 0.09))"
                : idx % 3 === 1
                ? "drop-shadow(0 1px 3px rgba(220, 38, 38, 0.08)) blur(0.12px)"
                : "drop-shadow(0 1px 4px rgba(99, 102, 241, 0.09)) blur(0.22px)",
          }}
          aria-hidden
        >
          <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
            {swirl.variant === "single" && (
              <path
                d="M14 40C14 27 24 17 37 17C49 17 58 26 58 38C58 47 51 54 42 54C35 54 30 49 30 42C30 37 34 33 39 33C43 33 46 36 46 40"
                stroke={swirl.color}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            )}
            {swirl.variant === "double" && (
              <>
                <path
                  d="M10 39C10 24 22 13 37 13C51 13 62 24 62 38C62 49 54 58 43 58C34 58 27 51 27 42C27 35 32 30 39 30C44 30 49 34 49 40C49 44 46 47 42 47"
                  stroke={swirl.color}
                  strokeWidth="2.35"
                  strokeLinecap="round"
                />
                <path
                  d="M15 26C20 20 27 16 35 16"
                  stroke={swirl.color}
                  strokeOpacity="0.72"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </>
            )}
            {swirl.variant === "complex" && (
              <>
                <path
                  d="M8 41C8 22 23 8 41 8C56 8 66 19 66 34C66 47 56 57 43 57C34 57 27 50 27 41C27 34 33 28 40 28C46 28 51 32 51 38C51 43 47 47 42 47"
                  stroke={swirl.color}
                  strokeWidth="2.45"
                  strokeLinecap="round"
                />
                <path
                  d="M12 30C17 20 26 14 37 12"
                  stroke={swirl.color}
                  strokeOpacity="0.7"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <path
                  d="M20 49C24 54 30 58 38 59"
                  stroke={swirl.color}
                  strokeOpacity="0.55"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </>
            )}
            {swirl.variant === "cheese" && (
              <image
                href={cheeseIcon}
                x="10"
                y="10"
                width="48"
                height="48"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter:
                    "invert(78%) sepia(67%) saturate(1061%) hue-rotate(358deg) brightness(98%) contrast(90%)",
                }}
              />
            )}
            {swirl.variant === "pizza" && (
              <image
                href={pizzaIcon}
                x="10"
                y="10"
                width="48"
                height="48"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter:
                    "invert(80%) sepia(55%) saturate(950%) hue-rotate(338deg) brightness(99%) contrast(92%)",
                }}
              />
            )}
            {swirl.variant === "tomato" && (
              <image
                href={tomatoIcon}
                x="10"
                y="10"
                width="48"
                height="48"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter:
                    "invert(55%) sepia(32%) saturate(1100%) hue-rotate(320deg) brightness(102%) contrast(88%)",
                }}
              />
            )}
            {swirl.variant === "mushroom" && (
              <image
                href={mushroomIcon}
                x="10"
                y="10"
                width="48"
                height="48"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter:
                    "invert(62%) sepia(23%) saturate(630%) hue-rotate(356deg) brightness(92%) contrast(88%)",
                }}
              />
            )}
          </svg>
        </div>
      ))}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const orderQ = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id),
  });

  const itemsQ = useQuery({
    queryKey: ["orderItems", id],
    queryFn: () => getOrderItems(id),
  });

  const reviewsQ = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => getReviews(id),
  });

  const [reviewOpen, setReviewOpen] = useState(false);
  const [localPendingReview, setLocalPendingReview] = useState(false);
  const shouldAutoOpenReview = searchParams.get("openReview") === "1";
  const hasReview = (reviewsQ.data?.length ?? 0) > 0;
  const currentReview = hasReview ? reviewsQ.data?.[0] : null;
  const reviewRating = hasReview ? Number(currentReview?.rating || 0) : 0;
  const isReviewPendingModeration =
    (hasReview && currentReview?.is_approved === false) ||
    (!hasReview && localPendingReview);

  useEffect(() => {
    if (shouldAutoOpenReview && !hasReview) {
      setReviewOpen(true);
    }
  }, [shouldAutoOpenReview, hasReview]);

  useEffect(() => {
    if (!id) return;
    setLocalPendingReview(localStorage.getItem(pendingReviewKey(id)) === "1");
  }, [id]);

  useEffect(() => {
    // Как только отзыв одобрен и виден клиенту - убираем локальный "pending" маркер.
    if (hasReview && currentReview?.is_approved) {
      localStorage.removeItem(pendingReviewKey(id));
      setLocalPendingReview(false);
    }
  }, [hasReview, currentReview?.is_approved, id]);

  if (orderQ.isLoading || itemsQ.isLoading) {
    return (
      <WarmPaperBackground>
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-14 w-full" />
        </div>
      </WarmPaperBackground>
    );
  }

  if (orderQ.isError || itemsQ.isError || !orderQ.data) {
    return (
      <WarmPaperBackground>
        <div className="mx-auto max-w-5xl px-4 py-8 text-[#DC2626]">
          Не удалось загрузить заказ.
        </div>
      </WarmPaperBackground>
    );
  }

  const order = orderQ.data.order ?? orderQ.data;    
  const finance = orderQ.data.finance;
  const items = itemsQ.data ?? [];

  const status =
    typeof order.status === "number"
      ? STATUS_MAP[order.status] ?? order.status
      : STATUS_MAP[order.status] ?? order.status;

  return (
    <WarmPaperBackground>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 pb-28 md:pb-8">
        <div className="rounded-2xl border border-[#CDC4DC] bg-[#F3EFFB] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1C1917]">Заказ №{order.id}</h1>

          <div className="flex items-center gap-3">
            {!hasReview && !isReviewPendingModeration && (
              <button
                onClick={() => setReviewOpen(true)}
                className="hidden rounded-xl bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.4)] transition hover:from-[#F59E0B] hover:to-[#D97706] md:inline-block"
              >
                Оставить отзыв
              </button>
            )}
            {hasReview && !isReviewPendingModeration && (
              <div className="rounded-lg border border-[#FDE68A] bg-white/80 px-2.5 py-1">
                <ReadonlyStars value={reviewRating} />
              </div>
            )}
            {isReviewPendingModeration && (
              <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 text-xs font-medium text-[#92400E]">
                Подождите... ваш отзыв на обработке
              </div>
            )}
            <Link to="/profile" className="hidden text-sm font-medium text-[#9C8F80] hover:underline md:inline">
              ← Назад
            </Link>
          </div>
        </div>

        {status && (
          <div className="mt-4 text-sm text-[#9C8F80]">
            Статус: <span className="font-medium text-[#1C1917]">{status}</span>
          </div>
        )}

        <div className="mt-2 text-sm text-[#9C8F80]">
          Дата:{" "}
          <span className="font-medium text-[#1C1917]">
            {new Date(order.order_date).toLocaleString()}
          </span>
        </div>

        {order.delivery_end_time && (
          <div className="mt-2 text-sm text-[#9C8F80]">
            Завершён:{" "}
            <span className="font-medium text-[#1C1917]">
              {new Date(order.delivery_end_time).toLocaleString()}
            </span>
          </div>
        )}
      </div>

        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id} className="relative overflow-hidden rounded-xl border border-[#E5E7F7] bg-[#F9FBFF] shadow-sm">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 70% at 15% 0%, rgba(250, 204, 21, 0.10) 0%, rgba(250, 204, 21, 0.035) 38%, rgba(255, 255, 255, 0) 70%)",
                }}
                aria-hidden
              />
              <CardContent className="flex items-center justify-between py-3">
                <div className="truncate">
                  <div className="truncate font-medium text-[#1C1917]">
                    {it.pizza_name ?? `Пицца #${it.pizza_id}`}
                  </div>
                  <div className="text-sm text-[#9C8F80]">
                    {it.quantity} × {Number(it.price_at_order).toFixed(0)} ₽
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/menu/pizzas"
                    className="shrink-0 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-xs font-medium text-[#9C8F80] hover:bg-[#FEF3C7]"
                  >
                    Посмотреть в меню
                  </Link>
                  <div className="font-semibold text-[#1C1917]">
                    {(Number(it.quantity) * Number(it.price_at_order)).toFixed(0)} ₽
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <div className="inline-flex items-center rounded-xl border border-[#FBCFE8]/70 bg-[#FDF2F8]/68 px-3 py-1.5 text-sm backdrop-blur-md shadow-[0_0_24px_rgba(251,207,232,0.65)]">
              <span className="mr-2 text-[#C77D2B]">Итого:</span>
              <span className="font-semibold text-[#1C1917]">
                {(finance?.total_after_discount ?? order.total_amount ?? 0).toFixed(0)} ₽
              </span>
            </div>
          </div>
        </div>

        <ReviewModal
          open={reviewOpen}
          orderId={id}
          onClose={() => setReviewOpen(false)}
          onSubmitted={() => {
            localStorage.setItem(pendingReviewKey(id), "1");
            setLocalPendingReview(true);
            qc.invalidateQueries({ queryKey: ["reviews", id] });
          }}
        />
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-30 md:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4">
          <Link
            to="/profile"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#BFDBFE] bg-[#93C5FD] px-4 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(59,130,246,0.24)] transition hover:bg-[#7EB7FA]"
          >
            ← Назад
          </Link>
          {!hasReview && !isReviewPendingModeration ? (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="h-11 flex-1 rounded-xl bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-4 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.4)] transition hover:from-[#F59E0B] hover:to-[#D97706]"
            >
              Оставить отзыв
            </button>
          ) : null}
        </div>
      </div>
    </WarmPaperBackground>
  );
}
