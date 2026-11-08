// src/pages/CookPage.jsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { cookGetDashboard, cookMarkCooked } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function formatDuration(sec) {
  if (sec == null) return "-";
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CookPage() {
  const [confirmItem, setConfirmItem] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["cook-dashboard"],
    queryFn: cookGetDashboard,
    refetchInterval: 15000,
  });

  const markCookedMutation = useMutation({
    mutationFn: (id) => cookMarkCooked(id),
    onSuccess: () => {
      setConfirmItem(null);
      refetch();
    },
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? [];

  const itemsInKitchen = items.filter((it) => it.status === "InKitchen");
  const itemsCooked = items.filter((it) => it.status === "Cooked");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Заказы для кухни</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Обновить
        </Button>
      </div>

      {isLoading && <p>Загрузка дэшборда...</p>}
      {isError && (
        <p className="text-red-600">
          Ошибка при загрузке данных кухни. Возможно, вы не повар или нет доступа.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {/* Верх: позиции + сводка */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Левый блок — позиции заказов (InKitchen) */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-2">Позиции заказов</h2>
              <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Заказ</th>
                      <th className="px-3 py-2 text-left">Пицца</th>
                      <th className="px-3 py-2 text-left">Кол-во</th>
                      <th className="px-3 py-2 text-left">Назначена</th>
                      <th className="px-3 py-2 text-left">Ожидание</th>
                      <th className="px-3 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsInKitchen.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-center text-gray-500"
                        >
                          Нет позиций, требующих приготовления.
                        </td>
                      </tr>
                    )}

                    {itemsInKitchen.map((it) => (
                      <tr
                        key={it.order_item_id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 text-sm">#{it.order_id}</td>
                        <td className="px-3 py-2 text-sm">{it.pizza_name}</td>
                        <td className="px-3 py-2 text-sm">{it.quantity}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {new Date(it.assigned_at).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2 text-sm font-mono">
                          {formatDuration(it.waiting_seconds)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setConfirmItem(it)}
                          >
                            Приготовлено
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Правый блок — сводка по пиццам */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold mb-2">Сводка по пиццам</h2>
              <div className="border rounded-lg bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Пицца</th>
                      <th className="px-3 py-2 text-left">Кол-во</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-4 text-center text-gray-500"
                        >
                          Нечего готовить.
                        </td>
                      </tr>
                    )}

                    {summary.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">{row.pizza_name}</td>
                        <td className="px-3 py-2">{row.total_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Низ: готовые позиции */}
          <h2 className="text-lg font-semibold mb-2">
            Готовые позиции (ожидают передачи)
          </h2>
          <div className="border rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left">Заказ</th>
                  <th className="px-3 py-2 text-left">Пицца</th>
                  <th className="px-3 py-2 text-left">Кол-во</th>
                  <th className="px-3 py-2 text-left">Готово</th>
                </tr>
              </thead>
              <tbody>
                {itemsCooked.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-gray-500"
                    >
                      Нет приготовленных позиций.
                    </td>
                  </tr>
                )}

                {itemsCooked.map((it) => (
                  <tr
                    key={it.order_item_id}
                    className="border-b last:border-b-0 bg-yellow-50"
                  >
                    <td className="px-3 py-2 text-sm">#{it.order_id}</td>
                    <td className="px-3 py-2 text-sm">{it.pizza_name}</td>
                    <td className="px-3 py-2 text-sm">{it.quantity}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">
                      ✓ Ожидает передачи
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Модалка подтверждения */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Подтвердите действие</h3>
            <p className="mb-6">
              Пометить позицию «{confirmItem.pizza_name}» как приготовленную?
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmItem(null)}>
                Нет
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  markCookedMutation.mutate(confirmItem.order_item_id)
                }
              >
                Да
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
