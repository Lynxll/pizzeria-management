import React, { createContext, useContext, useMemo, useRef, useState } from "react";

const LS_KEY = "pizzeria_cart_v1";

function readLS() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((i) => ({
      id: i.id,
      name: i.name ?? "",
      price: Number(i.price) || 0,
      qty: Number(i.qty) || 1,
    }));
  } catch {
    return [];
  }
}

function writeLS(items) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readLS());
  const first = useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    writeLS(items);
  }, [items]);

  const money = (v) => Number(v || 0);

  const total = useMemo(
    () => items.reduce((s, it) => s + money(it.price) * money(it.qty), 0),
    [items]
  );

  const api = useMemo(() => {
    const add = ({ id, name, price, qty = 1 }) => {
      const p = Number(price) || 0;
      const q = Math.max(1, Number(qty) || 1);

      setItems((prev) => {
        const copy = prev.map((x) => ({ ...x }));
        const found = copy.find((x) => x.id === id);
        if (found) {
          found.qty += q;
        } else {
          copy.push({ id, name: name ?? "", price: p, qty: q });
        }
        return copy;
      });
    };

    const inc = (id) =>
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))
      );

    const dec = (id) =>
      setItems((prev) =>
        prev
          .map((x) =>
            x.id === id ? { ...x, qty: Math.max(1, Number(x.qty) - 1) } : x
          )
          .filter(Boolean)
      );

    const setQty = (id, qty) =>
      setItems((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, qty: Math.max(1, Number(qty) || 1) } : x
        )
      );

    const remove = (id) =>
      setItems((prev) => prev.filter((x) => x.id !== id));

    const clear = () => setItems([]);

    return { add, inc, dec, setQty, remove, clear };
  }, []);

  const value = useMemo(
    () => ({ items, total, ...api }),
    [items, total, api]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
