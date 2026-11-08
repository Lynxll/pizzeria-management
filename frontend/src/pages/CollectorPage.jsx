// src/pages/CollectorPage.jsx
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  collectorGetDashboard,
  collectorMarkReceived,
  collectorMarkPacked,
  collectorResolveCancelled,
} from "@/api/client";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

function formatDurationFrom(dateStr) {
  if (!dateStr) return "-";
  const start = new Date(dateStr);
  const now = new Date();
  let sec = Math.floor((now.getTime() - start.getTime()) / 1000);
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString();
}

const OVERDUE_THRESHOLD_SEC = 5 * 60;

function isOrderOverdue(order) {
  if (!order.collector_state_since) return false;
  const since = new Date(order.collector_state_since);
  const now = new Date();
  const sec = (now.getTime() - since.getTime()) / 1000;
  return sec > OVERDUE_THRESHOLD_SEC;
}

function getOrderStats(order) {
  const items = order.items ?? [];
  const total = items.length;
  const inKitchen = items.filter((i) => i.status === "InKitchen").length;
  const cooked = items.filter((i) => i.status === "Cooked").length;
  const received = items.filter((i) => i.status === "ReceivedByCollector").length;
  return { total, inKitchen, cooked, received };
}

function getOrderState(order) {
  const { total, inKitchen, cooked, received } = getOrderStats(order);
  const overdue = isOrderOverdue(order);

  if (total === 0) {
    return { color: "bg-gray-50", label: "Нет позиций" };
  }

  if (received === total && total > 0) {
    if (overdue) {
      return { color: "bg-red-100", label: "Готов к сборке (просрочен)" };
    }
    return { color: "bg-green-100", label: "Готов к сборке" };
  }

  if (cooked > 0 || received > 0) {
    if (overdue) {
      return { color: "bg-red-100", label: "Можно собирать (просрочен)" };
    }
    return { color: "bg-yellow-100", label: "Есть новые приготовленные позиции" };
  }

  return { color: "bg-gray-50", label: "В работе на кухне" };
}

export default function CollectorPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [confirmReceiveItem, setConfirmReceiveItem] = useState(null);
  const [confirmPackedOrder, setConfirmPackedOrder] = useState(null);
  const [confirmResolveItem, setConfirmResolveItem] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["collector-dashboard"],
    queryFn: collectorGetDashboard,
    refetchInterval: 15000,
  });

  const orders = data?.orders ?? [];
  const cancelledItems = data?.cancelled_items ?? [];

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );


  const markReceivedMutation = useMutation({
    mutationFn: (orderItemId) => collectorMarkReceived(orderItemId),
    onSuccess: () => {
      setConfirmReceiveItem(null);
      refetch();
    },
  });

  const markPackedMutation = useMutation({
    mutationFn: (orderId) => collectorMarkPacked(orderId),
    onSuccess: () => {
      setConfirmPackedOrder(null);
      refetch();
    },
  });

  const resolveCancelledMutation = useMutation({
    mutationFn: (orderItemId) => collectorResolveCancelled(orderItemId),
    onSuccess: () => {
      setConfirmResolveItem(null);
      refetch();
    },
  });

  // сводка по заказам 

  const summary = useMemo(() => {
    const workingOrders = orders.length;

    let yellowPositions = 0;
    let readyOrders = 0;
    let overdueOrders = 0;

    for (const o of orders) {
      const { total, cooked, received, inKitchen } = getOrderStats(o);
      const overdue = isOrderOverdue(o);
      yellowPositions += cooked;

      if (received === total && total > 0 && inKitchen === 0) {
        if (overdue) {
          overdueOrders++;
        } else {
          readyOrders++;
        }
      } else if (overdue) {
        overdueOrders++;
      }
    }

    return { workingOrders, yellowPositions, readyOrders, overdueOrders };
  }, [orders]);

  // UI 

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Дэшборд сборщика</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Обновить
        </Button>
      </div>

      {isLoading && <p>Загрузка дэшборда...</p>}
      {isError && (
        <p className="text-red-600">
          Ошибка при загрузке данных сборщика. Возможно, нет доступа.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="md:col-span-1 space-y-3">
              <h2 className="text-lg font-semibold mb-2">Заказы</h2>
              {orders.length === 0 && (
                <div className="border rounded-lg bg-white px-3 py-4 text-center text-gray-500">
                  Нет активных заказов для сборки.
                </div>
              )}

              {orders.map((o) => {
                const stats = getOrderStats(o);
                const state = getOrderState(o);
                const hasNewCooked = stats.cooked > 0;
                const isSelected = selectedOrderId === o.order_id;

                return (
                  <button
                    key={o.order_id}
                    type="button"
                    onClick={() =>
                      setSelectedOrderId(
                        o.order_id === selectedOrderId ? null : o.order_id
                      )
                    }
                    className={[
                      "w-full text-left border rounded-lg px-3 py-2 transition-colors",
                      state.color,
                      isSelected ? "ring-2 ring-black" : "hover:bg-gray-100",
                    ].join(" ")}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Заказ #{o.order_id}</span>
                      <span className="text-xs text-gray-500">
                        {formatTime(o.order_date)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 mb-1">
                      {o.customer_name && (
                        <div>Клиент: {o.customer_name}</div>
                      )}
                      {o.address && (
                        <div className="truncate">Адрес: {o.address}</div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>
                        Позиции: {stats.received} из {stats.total} у сборщика
                      </span>
                      {hasNewCooked && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-400 text-xs font-semibold">
                          Новое
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-700">
                      <span className="font-medium">{state.label}</span>
                      {" · "}
                      <span>
                        Ожидание: {formatDurationFrom(o.order_date)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-2">
                Детали заказа
              </h2>

              {!selectedOrder && (
                <div className="border rounded-lg bg-white px-4 py-6 text-gray-500 text-center">
                  Выберите заказ слева, чтобы увидеть детали.
                </div>
              )}

              {selectedOrder && (
                <div className="border rounded-lg bg-white p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        Заказ #{selectedOrder.order_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ожидание:{" "}
                        {formatDurationFrom(selectedOrder.order_date)}
                      </p>
                      {selectedOrder.address && (
                        <p className="text-sm text-gray-600">
                          Адрес: {selectedOrder.address}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrderId(null)}
                    >
                      Назад
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left">Пицца</th>
                          <th className="px-3 py-2 text-left">Кол-во</th>
                          <th className="px-3 py-2 text-left">Статус</th>
                          <th className="px-3 py-2 text-left"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-4 text-center text-gray-500"
                            >
                              Нет позиций для отображения.
                            </td>
                          </tr>
                        )}

                        {selectedOrder.items.map((it) => {
                          let rowClass = "";
                          if (it.status === "Cooked") rowClass = "bg-yellow-50";
                          if (it.status === "ReceivedByCollector")
                            rowClass = "bg-green-50";

                          let statusLabel = "";
                          switch (it.status) {
                            case "InKitchen":
                              statusLabel = "Готовится";
                              break;
                            case "Cooked":
                              statusLabel = "Приготовлена";
                              break;
                            case "ReceivedByCollector":
                              statusLabel = "У сборщика";
                              break;
                            default:
                              statusLabel = it.status;
                          }

                          return (
                            <tr
                              key={it.id}
                              className={`border-b last:border-b-0 ${rowClass}`}
                            >
                              <td className="px-3 py-2">{it.pizza_name}</td>
                              <td className="px-3 py-2">{it.quantity}</td>
                              <td className="px-3 py-2 text-sm">
                                {statusLabel}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {it.status === "Cooked" ? (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => setConfirmReceiveItem(it)}
                                  >
                                    Принято
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    &nbsp;
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={
                        selectedOrder.items.length === 0 ||
                        !selectedOrder.items.every(
                          (it) => it.status === "ReceivedByCollector"
                        )
                      }
                      onClick={() => setConfirmPackedOrder(selectedOrder)}
                    >
                      Заказ собран
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Сводка</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg bg-white px-3 py-2">
                <div className="text-xs text-gray-500">Рабочих заказов</div>
                <div className="text-xl font-semibold">
                  {summary.workingOrders}
                </div>
              </div>
              <div className="border rounded-lg bg-white px-3 py-2">
                <div className="text-xs text-gray-500">
                  Приготовленных, но не принятых позиций
                </div>
                <div className="text-xl font-semibold">
                  {summary.yellowPositions}
                </div>
              </div>
              <div className="border rounded-lg bg-white px-3 py-2">
                <div className="text-xs text-gray-500">
                  Готовых к сборке заказов
                </div>
                <div className="text-xl font-semibold">
                  {summary.readyOrders}
                </div>
              </div>
              <div className="border rounded-lg bg-white px-3 py-2">
                <div className="text-xs text-gray-500">
                  Просроченных заказов
                </div>
                <div className="text-xl font-semibold text-red-600">
                  {summary.overdueOrders}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              Отменённые позиции заказа
            </h2>
            <div className="border rounded-lg bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">Заказ</th>
                    <th className="px-3 py-2 text-left">Пицца</th>
                    <th className="px-3 py-2 text-left">Кол-во</th>
                    <th className="px-3 py-2 text-left">Статус</th>
                    <th className="px-3 py-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Нет отменённых позиций, требующих внимания.
                      </td>
                    </tr>
                  )}

                  {cancelledItems.map((it) => {
                    let statusLabel =
                      it.status === "Cooked"
                        ? "Приготовлена"
                        : it.status === "ReceivedByCollector"
                        ? "Была у сборщика"
                        : it.status;

                    return (
                      <tr
                        key={it.order_item_id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-3 py-2">#{it.order_id}</td>
                        <td className="px-3 py-2">{it.pizza_name}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2 text-sm">{statusLabel}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmResolveItem(it)}
                          >
                            Вопрос решён
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/*Модалка подтверждения "Принято" */}
      {confirmReceiveItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Подтвердите действие</h3>
            <p className="mb-6">
              Пометить позицию «{confirmReceiveItem.pizza_name}» как принятую
              сборщиком?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmReceiveItem(null)}>
                Нет
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  markReceivedMutation.mutate(confirmReceiveItem.id)
                }
              >
                Да
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmPackedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Подтвердите действие</h3>
            <p className="mb-6">
              Заказ #{confirmPackedOrder.order_id} действительно собран и может
              уйти на доставку?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmPackedOrder(null)}>
                Нет
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() =>
                  markPackedMutation.mutate(confirmPackedOrder.order_id)
                }
              >
                Да
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmResolveItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Подтвердите действие</h3>
            <p className="mb-6">
              Убрать отменённую позицию «{confirmResolveItem.pizza_name}» из
              списка?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmResolveItem(null)}>
                Нет
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() =>
                  resolveCancelledMutation.mutate(
                    confirmResolveItem.order_item_id
                  )
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
