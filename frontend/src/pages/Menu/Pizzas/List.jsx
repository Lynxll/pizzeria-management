import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMenus, getPizzas } from "@/api/client";
import { useCart } from "@/store/cart-store";

function Money({ value }) {
  return <span className="font-semibold">{(value ?? 0).toFixed(0)} ₽</span>;
}

export default function PizzasList() {
  const [items, setItems] = useState(null);
  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [menuItems, pizzas] = await Promise.all([getMenus(), getPizzas()]);

        const priceByPizzaId = new Map(
          (Array.isArray(menuItems) ? menuItems : [])
            .filter(m => m.is_active === true || m.active === true)
            .map(m => [m.pizza_id, m.price])
        );

        const normalized = (Array.isArray(pizzas) ? pizzas : []).map(p => {
          const fromMenu = priceByPizzaId.get(p.id);
          const available = priceByPizzaId.has(p.id);
          return {
            id: p.id,
            name: p.name,
            desc: p.description ?? "",
            price: fromMenu ?? p.cost_price ?? p.price ?? 0,
            available,
          };
        });

        if (!cancelled) setItems(normalized);
      } catch (e) {
        console.error("Ошибка загрузки меню/пицц:", e);
        if (!cancelled) setItems([]);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (items === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-36 w-full" />
            <CardHeader className="pb-2"><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items.length) return <div className="text-gray-500">Меню пока пустое.</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(p => (
        <Card key={p.id} className="overflow-hidden">
          <div className="h-36 bg-neutral-100" />

          <CardHeader className="pb-2">
            <CardTitle className="text-base">{p.name}</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-neutral-600">{p.desc}</p>

            <span
              className={`text-xs font-semibold ${
                p.available ? "text-green-600" : "text-red-500"
              }`}
            >
              {p.available ? "В наличии" : "Нет в наличии"}
            </span>

            <div className="flex items-center justify-between">
              <Money value={p.price} />
              <Button
                size="sm"
                onClick={() => add({ id: p.id, name: p.name, price: p.price })}
                disabled={!p.available}
              >
                В корзину
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
