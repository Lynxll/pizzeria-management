import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/store/cart-store";
import WarmPaperBackground from "@/components/WarmPaperBackground";

const money = (v) => Number(v || 0);

export default function CartPage() {
  const nav = useNavigate();
  const { items, total, inc, dec, remove, clear } = useCart();

  const isEmpty = items.length === 0;

  const rows = useMemo(
    () =>
      items.map((it) => {
        const line = money(it.price) * money(it.qty);
        return { ...it, line };
      }),
    [items]
  );

  return (
    <WarmPaperBackground>
      <div className="mx-auto max-w-5xl px-4 py-8 pb-28 md:pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1C1917]">Корзина</h1>
          {!isEmpty && (
            <button
              onClick={clear}
              className="text-sm text-[#B91C1C] transition-colors hover:text-[#991B1B]"
              title="Очистить корзину"
            >
              Очистить
            </button>
          )}
        </div>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {rows.map((it) => (
              <CartRow
                key={it.id}
                item={it}
                onInc={() => inc(it.id)}
                onDec={() => dec(it.id)}
                onRemove={() => remove(it.id)}
              />
            ))}

            <div className="relative overflow-hidden rounded-xl border border-[#FDE68A] bg-white p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    "radial-gradient(120% 70% at 15% 0%, rgba(250, 204, 21, 0.10) 0%, rgba(250, 204, 21, 0.035) 38%, rgba(255, 255, 255, 0) 70%)",
                }}
                aria-hidden
              />
              <div className="relative z-10 flex items-center justify-between">
                <div className="text-sm text-[#C77D2B]/75">Итого к оплате</div>
                <div className="text-lg font-semibold text-[#1C1917]">
                  {money(total).toFixed(0)} ₽
                </div>
              </div>
            </div>

            <div className="hidden gap-3 md:flex">
              <Link
                to="/menu/pizzas"
                className="rounded-lg border border-[#E6A04B] bg-transparent px-4 py-2 text-sm font-medium text-[#E6A04B] transition-colors hover:bg-[rgba(230,160,75,0.1)]"
              >
                Продолжить выбор
              </Link>
              <button
                onClick={() => nav("/checkout")}
                className="rounded-lg bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_22px_rgba(245,158,11,0.33)]"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>

      {!isEmpty ? (
        <div className="fixed bottom-4 left-0 right-0 z-30 md:hidden">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4">
            <Link
              to="/menu/pizzas"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E6A04B] bg-transparent px-4 text-sm font-semibold text-[#E6A04B] transition-colors hover:bg-[rgba(230,160,75,0.1)]"
            >
              Продолжить выбор
            </Link>
            <button
              onClick={() => nav("/checkout")}
              className="h-11 flex-1 rounded-xl bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-4 text-sm font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_22px_rgba(245,158,11,0.33)]"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      ) : null}
    </WarmPaperBackground>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-[#E9D5FF] bg-white/85 p-8 text-center text-[#9C8F80]/75 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
      Корзина пуста.{" "}
      <Link to="/menu/pizzas" className="text-[#4F46E5] hover:underline">
        Выберите пиццу из меню
      </Link>
      .
    </div>
  );
}

function CartRow({ item, onInc, onDec, onRemove }) {
  return (
    <div className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-[#FDE68A] bg-white p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_14px_35px_rgba(0,0,0,0.12)]">
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background:
            "radial-gradient(120% 70% at 15% 0%, rgba(250, 204, 21, 0.10) 0%, rgba(250, 204, 21, 0.035) 38%, rgba(255, 255, 255, 0) 70%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 min-w-0">
        <div className="truncate font-medium text-[#1C1917]">{item.name}</div>
        <div className="text-sm text-[#9C8F80]/75">
          {money(item.price).toFixed(0)} ₽ за шт.
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <QtyControl qty={item.qty} onInc={onInc} onDec={onDec} />
        <div className="w-24 text-right font-semibold text-[#1C1917]">
          {money(item.line).toFixed(0)} ₽
        </div>
        <button
          onClick={onRemove}
          className="text-sm text-[#B91C1C] hover:underline"
          title="Удалить позицию"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function QtyControl({ qty, onInc, onDec }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-[#E9D5FF] bg-[#FAF5FF]/60">
      <button
        type="button"
        onClick={onDec}
        className="select-none px-3 py-1 text-lg leading-none text-[#4C1D95]"
        aria-label="Уменьшить"
      >
        –
      </button>
      <div className="min-w-[2.5rem] px-3 py-1 text-center text-[#1C1917]">{qty}</div>
      <button
        type="button"
        onClick={onInc}
        className="select-none px-3 py-1 text-lg leading-none text-[#4C1D95]"
        aria-label="Увеличить"
      >
        +
      </button>
    </div>
  );
}
