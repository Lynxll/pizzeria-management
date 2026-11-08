import WarmPaperBackground from "@/components/WarmPaperBackground";
import Stars from "@/components/ui/Stars";
import cheeseIcon from "@/assets/icons8-сыр-64.png";
import pizzaIcon from "@/assets/icons8-пицца-64.png";
import tomatoIcon from "@/assets/icons8-tomato-64.png";
import mushroomIcon from "@/assets/icons8-mushroom-64.png";

const MOBILE_SWIRLS = [
  { x: "10%", y: "28%", color: "#5B21B6", rotate: "-14deg", scale: 0.72, opacity: 0.19, variant: "complex" },
  { x: "86%", y: "34%", color: "#DC2626", rotate: "11deg", scale: 0.66, opacity: 0.16, variant: "single" },
  { x: "12%", y: "43%", color: "#EAB308", rotate: "-7deg", scale: 0.68, opacity: 0.16, variant: "cheese" },
  { x: "86%", y: "50%", color: "#B88746", rotate: "12deg", scale: 0.66, opacity: 0.16, variant: "mushroom" },
  { x: "11%", y: "58%", color: "#6366F1", rotate: "-10deg", scale: 0.7, opacity: 0.17, variant: "double" },
  { x: "86%", y: "66%", color: "#EF4444", rotate: "15deg", scale: 0.68, opacity: 0.16, variant: "tomato" },
  { x: "14%", y: "74%", color: "#EAB308", rotate: "-11deg", scale: 0.65, opacity: 0.14, variant: "pizza" },
  { x: "86%", y: "80%", color: "#7C3AED", rotate: "13deg", scale: 0.72, opacity: 0.16, variant: "complex" },
  { x: "18%", y: "38%", color: "#DC2626", rotate: "8deg", scale: 0.62, opacity: 0.14, variant: "single" },
  { x: "80%", y: "43%", color: "#EAB308", rotate: "-9deg", scale: 0.62, opacity: 0.14, variant: "cheese" },
  { x: "16%", y: "52%", color: "#B91C1C", rotate: "17deg", scale: 0.66, opacity: 0.14, variant: "complex" },
  { x: "80%", y: "57%", color: "#4C1D95", rotate: "14deg", scale: 0.64, opacity: 0.14, variant: "double" },
  { x: "16%", y: "67%", color: "#EAB308", rotate: "-8deg", scale: 0.6, opacity: 0.13, variant: "pizza" },
  { x: "82%", y: "72%", color: "#B88746", rotate: "10deg", scale: 0.62, opacity: 0.13, variant: "mushroom" },
  { x: "20%", y: "81%", color: "#DC2626", rotate: "-12deg", scale: 0.62, opacity: 0.12, variant: "tomato" },
  { x: "78%", y: "86%", color: "#6366F1", rotate: "12deg", scale: 0.64, opacity: 0.12, variant: "single" },
];

export default function ReviewsMobileView({
  reviews,
  isLoading,
  isNavigatingToReview,
  onGoToLastOrderReview,
}) {
  return (
    <WarmPaperBackground>
      <section className="relative w-full overflow-x-hidden px-4 pb-28 pt-4 md:mx-auto md:max-w-5xl">
        {MOBILE_SWIRLS.map((swirl, idx) => (
          <div
            key={`mobile-swirl-${idx}`}
            className="pointer-events-none absolute z-[1]"
            style={{
              top: swirl.y,
              left: swirl.x,
              transform: `rotate(${swirl.rotate}) scale(${swirl.scale})`,
              opacity: swirl.opacity,
            }}
            aria-hidden
          >
            <svg width="64" height="64" viewBox="0 0 68 68" fill="none">
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

        <header className="relative mb-4 overflow-hidden rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 shadow-[0_6px_20px_rgba(28,25,23,0.06)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#DC2626]/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-[#F59E0B]/15" />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(90% 60% at 15% 0%, rgba(250, 204, 21, 0.12) 0%, rgba(250, 204, 21, 0.04) 38%, rgba(255, 255, 255, 0) 70%)",
            }}
            aria-hidden
          />
          <h1 className="relative text-3xl font-semibold text-[#1C1917]">Отзывы</h1>
          <p className="relative mt-2 max-w-2xl text-sm text-[#C77D2B]">
            Нам важно ваше мнение: здесь публикуются отзывы клиентов о заказах и
            доставке.
          </p>
        </header>

        <div className="relative z-10 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-[#FDE68A] bg-white p-4 text-sm text-[#1C1917]/70">
              Загружаем отзывы...
            </div>
          ) : null}

          {!isLoading && reviews.length === 0 ? (
            <div className="rounded-xl border border-[#FDE68A] bg-white p-4 text-sm text-[#1C1917]/70">
              Пока нет отзывов.
            </div>
          ) : null}

          {reviews.map((review) => (
            <article
              key={review.id}
              className="group relative overflow-hidden rounded-xl border border-[#FDE68A] bg-white p-3 shadow-[0_2px_12px_rgba(28,25,23,0.06)] transition-colors"
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    "radial-gradient(120% 70% at 15% 0%, rgba(250, 204, 21, 0.12) 0%, rgba(250, 204, 21, 0.04) 38%, rgba(255, 255, 255, 0) 70%)",
                }}
                aria-hidden
              />
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-semibold text-[#1C1917]">
                  {review.customer_name ?? `Заказ №${review.order_id}`}
                </div>
                <Stars value={review.rating} />
              </div>
              {review.comment ? (
                <p className="mt-2 text-sm text-[#1C1917]/85">{review.comment}</p>
              ) : (
                <p className="mt-2 text-sm text-[#DC2626]/80">Без комментария</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="fixed bottom-4 left-0 right-0 z-30">
        <div className="w-full px-4 md:mx-auto md:max-w-5xl">
          <button
            type="button"
            onClick={onGoToLastOrderReview}
            disabled={isNavigatingToReview}
            className="w-full rounded-xl bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.35)] transition hover:from-[#F59E0B] hover:to-[#D97706] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isNavigatingToReview ? "Открываем заказ..." : "Оставить отзыв"}
          </button>
        </div>
      </div>
    </WarmPaperBackground>
  );
}
