import cheeseIcon from "@/assets/icons8-сыр-64.png";
import pizzaIcon from "@/assets/icons8-пицца-64.png";
import tomatoIcon from "@/assets/icons8-tomato-64.png";
import mushroomIcon from "@/assets/icons8-mushroom-64.png";

const BG_SWIRLS = [
  { x: "8%", y: "17%", color: "#5B21B6", rotate: "-12deg", scale: 1.08, variant: "complex" },
  { x: "22%", y: "13%", color: "#EAB308", rotate: "-6deg", scale: 0.76, variant: "cheese" },
  { x: "36%", y: "11%", color: "#EAB308", rotate: "11deg", scale: 0.78, variant: "pizza" },
  { x: "54%", y: "16%", color: "#DC2626", rotate: "8deg", scale: 0.76, variant: "tomato" },
  { x: "70%", y: "13%", color: "#B88746", rotate: "-12deg", scale: 0.74, variant: "mushroom" },
  { x: "86%", y: "19%", color: "#7C3AED", rotate: "13deg", scale: 1.02, variant: "double" },
  { x: "10%", y: "50%", color: "#6366F1", rotate: "-11deg", scale: 0.98, variant: "double" },
  { x: "25%", y: "42%", color: "#EAB308", rotate: "9deg", scale: 0.74, variant: "cheese" },
  { x: "42%", y: "48%", color: "#EAB308", rotate: "-11deg", scale: 0.72, variant: "pizza" },
  { x: "60%", y: "44%", color: "#4C1D95", rotate: "9deg", scale: 0.9, variant: "single" },
  { x: "76%", y: "50%", color: "#DC2626", rotate: "-8deg", scale: 0.74, variant: "tomato" },
  { x: "91%", y: "45%", color: "#B88746", rotate: "12deg", scale: 0.72, variant: "mushroom" },
  { x: "7%", y: "82%", color: "#F43F5E", rotate: "-10deg", scale: 0.92, variant: "single" },
  { x: "27%", y: "86%", color: "#EAB308", rotate: "7deg", scale: 0.78, variant: "cheese" },
  { x: "46%", y: "88%", color: "#EAB308", rotate: "-14deg", scale: 0.76, variant: "pizza" },
  { x: "64%", y: "82%", color: "#6366F1", rotate: "13deg", scale: 0.98, variant: "complex" },
  { x: "82%", y: "86%", color: "#DC2626", rotate: "-10deg", scale: 0.76, variant: "tomato" },
  { x: "93%", y: "80%", color: "#B88746", rotate: "11deg", scale: 0.72, variant: "mushroom" },
];

export default function WarmPaperBackground({ children }) {
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
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply"
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
        className="pointer-events-none fixed inset-0 z-0 opacity-18"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1200'%3E%3Cpath d='M-20 170 C 180 120, 350 250, 560 190 C 780 125, 1000 235, 1240 170 C 1390 130, 1500 165, 1640 145' stroke='%236366F1' stroke-opacity='0.23' stroke-width='4' fill='none'/%3E%3Cpath d='M-40 280 C 140 340, 330 230, 520 285 C 730 345, 930 235, 1140 292 C 1320 340, 1480 260, 1640 310' stroke='%23DC2626' stroke-opacity='0.2' stroke-width='4' fill='none'/%3E%3Cpath d='M-30 430 C 220 370, 420 490, 640 435 C 860 385, 1100 510, 1310 445 C 1450 405, 1540 435, 1640 420' stroke='%235B21B6' stroke-opacity='0.18' stroke-width='3.5' fill='none'/%3E%3Cpath d='M-60 610 C 140 680, 330 540, 520 610 C 700 675, 920 560, 1100 620 C 1310 690, 1490 575, 1650 640' stroke='%23B91C1C' stroke-opacity='0.19' stroke-width='4' fill='none'/%3E%3Cpath d='M-20 790 C 170 735, 370 850, 600 790 C 820 735, 1040 855, 1270 800 C 1430 760, 1520 800, 1640 775' stroke='%234C1D95' stroke-opacity='0.17' stroke-width='3.5' fill='none'/%3E%3Cpath d='M-50 980 C 150 1035, 360 930, 580 985 C 800 1040, 1010 930, 1230 990 C 1410 1040, 1520 960, 1640 1015' stroke='%23EF4444' stroke-opacity='0.16' stroke-width='3.5' fill='none'/%3E%3C/svg%3E\")",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      {BG_SWIRLS.map((swirl, idx) => (
        <div
          key={`global-bg-swirl-${idx}`}
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
