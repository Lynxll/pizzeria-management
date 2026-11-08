import React from "react";

function Stars({ value = 0, onChange, readOnly = false, size = "md" }) {
  const count = 5;
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" };
  const clsSize = sizes[size] ?? sizes.md;

  return (
    <div className={`inline-flex items-center gap-1 ${clsSize}`}>
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const active = n <= value;
        const btnClass = active ? "text-yellow-500" : "text-neutral-300";

        if (readOnly) {
          return (
            <span key={n} className={btnClass} aria-hidden>
              ★
            </span>
          );
        }

        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={`${btnClass} leading-none`}
            aria-label={`Оценка ${n}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default Stars;            
export { Stars };   