// src/pages/Courier/CourierPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  courierGetState,
  courierStartShift,
  courierStopShift,
  courierStartBreak,
  courierStopBreak,
  courierGetActiveOrders, // <-- возвращает { active, queue }
  courierTakeOrder,
  courierCompleteOrder,
  courierTripDepart,
  courierTripReturn,
  courierMapOrders, // GET /courier/map -> { available, route, route_path }
} from "@/api/client";

import { Button } from "@/components/ui/button";
import CourierMap from "@/components/CourierMap";

function formatSeconds(sec) {
  if (sec == null) return "15:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function deliveryStatusRaw(d) {
  if (!d) return "";
  return String(d.delivery_status ?? d.status ?? "");
}

function isAssignedStatus(d) {
  return deliveryStatusRaw(d).toLowerCase() === "assigned";
}

function isInProgressStatus(d) {
  return deliveryStatusRaw(d).toLowerCase() === "inprogress";
}

function OrderCard({
  title,
  d,
  onTake,
  onComplete,
  takeLoading,
  completeLoading,
  outForDelivery,
}) {
  if (!d) return null;

  const status = d.delivery_status ?? d.status; // на всякий
  const o = d.order ?? d.Order;
  const deliveryOrderId = d.order_id ?? d.orderId;
  const nestedOrderId = o?.id ?? o?.order_id ?? o?.orderId;
  const orderPayloadMismatch =
    o != null &&
    deliveryOrderId != null &&
    nestedOrderId != null &&
    Number(nestedOrderId) !== Number(deliveryOrderId);

  const address =
    o?.delivery_address ?? d.delivery_address ?? d.address ?? "-";

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="text-xs uppercase text-gray-500 mb-1">{title}</div>

      {orderPayloadMismatch ? (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mb-2">
          Несовпадение: у доставки заказ #{deliveryOrderId}, во вложенном объекте order —
          #{nestedOrderId}. Реквизиты клиента ниже могут относиться не к этому заказу — проверьте
          ответ API «активные заказы курьера» на бэке.
        </div>
      ) : null}

      <div className="font-semibold mb-1">
        Заказ #{deliveryOrderId} — {address}
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <div>Клиент: {o?.customer_name ?? "-"}</div>
        <div>Телефон: {o?.contact_phone ?? "-"}</div>
        <div>Сумма: {o?.total_amount ?? 0} ₽</div>

        <div>
          Оплата: {o?.pay_cash ? "наличными" : "картой"}
          {o?.pay_cash && o?.change_from ? <>{" (сдача с "}{o.change_from} ₽)</> : null}
        </div>

        {o?.need_call_courier ? <div className="text-amber-700">Нужен звонок курьера</div> : null}
        {o?.comment ? <div>Комментарий: {o.comment}</div> : null}

        <div className="text-xs text-neutral-500">
          Очередь: {d.queue_position ?? "-"} / статус: {String(status)}
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {isAssignedStatus(d) && (
          <Button
            size="sm"
            disabled={
              takeLoading ||
              d.is_available_for_take === false ||
              outForDelivery
            }
            title={
              outForDelivery
                ? "Сначала завершите рейс и вернитесь на базу (кнопка «На базе»)."
                : d.is_available_for_take === false
                  ? "Этот заказ пока нельзя взять (не в первых 4)"
                  : ""
            }
            onClick={() => onTake?.(d.id)}
          >
            Взять заказ
          </Button>
        )}

        {isInProgressStatus(d) && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={completeLoading}
            onClick={() => onComplete?.(d.id)}
          >
            Доставил
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CourierPage() {
  // --- State курьера ---
  const { data: state, isLoading: stateLoading, refetch: refetchState } = useQuery({
    queryKey: ["courier-state"],
    queryFn: courierGetState,
  });

  const isOnShift = state?.isOnShift ?? false;
  const isOnBreak = state?.isOnBreak ?? false;
  const isOutForDelivery =
    state?.isOutForDelivery ?? state?.is_out_for_delivery ?? false;
  const breakUntil = state?.breakUntil ? new Date(state.breakUntil) : null;

  const [breakLeft, setBreakLeft] = useState(null);

  useEffect(() => {
    if (!breakUntil || !isOnBreak) {
      setBreakLeft(null);
      return;
    }
    const update = () => {
      const diffMs = breakUntil.getTime() - Date.now();
      setBreakLeft(Math.max(0, Math.floor(diffMs / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [breakUntil, isOnBreak]);

  // --- Активные/очередь (слева) ---
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorDetail,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["courier-active-orders"],
    queryFn: courierGetActiveOrders,
    enabled: isOnShift && !isOnBreak,
    refetchInterval: 10_000,
  });

  const active = ordersData?.active ?? null;
  const queue = ordersData?.queue ?? [];
  const queueLen = Array.isArray(queue) ? queue.length : 0;
  const noOrdersFromApi = !active && queueLen === 0;

  /** Все доставки «назначен / в пути» для полных карточек (не только 2 шт.: active + next). */
  const courierDeliveryCards = useMemo(() => {
    const byId = new Map();
    const put = (x) => {
      if (x?.id == null) return;
      byId.set(x.id, x);
    };
    put(active);
    if (Array.isArray(queue)) queue.forEach(put);
    const list = Array.from(byId.values()).filter(
      (d) => isAssignedStatus(d) || isInProgressStatus(d)
    );
    list.sort((a, b) => {
      const qa = a.queue_position ?? 9999;
      const qb = b.queue_position ?? 9999;
      if (Number(qa) !== Number(qb)) return Number(qa) - Number(qb);
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
    return list;
  }, [active, queue]);

  // --- карта (справа) ---
  const {
    data: mapData,
    isLoading: mapLoading,
    isFetching: mapFetching,
    refetch: refetchMap,
  } = useQuery({
    queryKey: ["courier-map"],
    queryFn: courierMapOrders,
    enabled: isOnShift && !isOnBreak,
    // Не опрашиваем карту по таймеру: на бэке это тянет GraphHopper (VRP + Route API).
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const available = mapData?.available ?? [];
  const route = mapData?.route ?? [];
  const routePath = mapData?.routePath ?? mapData?.route_path ?? null;
  const routingWarning =
    mapData?.routingWarning ?? mapData?.routing_warning ?? null;

  const hasInProgress = useMemo(() => {
    if (isInProgressStatus(active)) return true;
    if (!Array.isArray(queue)) return false;
    return queue.some((d) => isInProgressStatus(d));
  }, [active, queue]);

  /** Сжимает несколько «Доставил» подряд в один вызов /courier/map (Route API minutely limit). */
  const mapDebounceRef = useRef(null);
  const scheduleDebouncedMapRefetch = useCallback(
    (delayMs) => {
      if (mapDebounceRef.current != null) clearTimeout(mapDebounceRef.current);
      mapDebounceRef.current = window.setTimeout(() => {
        mapDebounceRef.current = null;
        void refetchMap();
      }, delayMs);
    },
    [refetchMap]
  );

  useEffect(
    () => () => {
      if (mapDebounceRef.current != null) clearTimeout(mapDebounceRef.current);
    },
    []
  );

  // --- мутации ---
  const startShiftMut = useMutation({
    mutationFn: courierStartShift,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      await refetchMap();
    },
  });

  const stopShiftMut = useMutation({
    mutationFn: courierStopShift,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      // Карта скрыта после смены; не дергаем GraphHopper.
    },
  });

  const startBreakMut = useMutation({
    mutationFn: courierStartBreak,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      // Запрос карты отключён на перерыве; лишний вызов к GH не нужен.
    },
  });

  const stopBreakMut = useMutation({
    mutationFn: courierStopBreak,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      // Карта снова включится — один актуальный снимок; без этого останется кэш Infinity.
      await refetchMap();
    },
  });

  const takeOrderMut = useMutation({
    mutationFn: (deliveryId) => courierTakeOrder(deliveryId),
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      // Не вызываем /map на каждый «Взять» — маршрут нужен после «Выехал» (один запрос на пачку).
    },
  });

  const completeOrderMut = useMutation({
    mutationFn: (deliveryId) => courierCompleteOrder(deliveryId),
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      scheduleDebouncedMapRefetch(3500);
    },
  });

  const tripDepartMut = useMutation({
    mutationFn: courierTripDepart,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      await refetchMap();
    },
  });

  const tripReturnMut = useMutation({
    mutationFn: courierTripReturn,
    onSuccess: async () => {
      await refetchState();
      await refetchOrders();
      await refetchMap();
    },
  });

  const loading =
    stateLoading ||
    startShiftMut.isLoading ||
    stopShiftMut.isLoading ||
    startBreakMut.isLoading ||
    stopBreakMut.isLoading ||
    tripDepartMut.isLoading ||
    tripReturnMut.isLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-center">Панель курьера</h1>

      {/* Кнопки смены / перерыва */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {!isOnShift ? (
            <Button
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              onClick={() => startShiftMut.mutate()}
            >
              Начать смену
            </Button>
          ) : (
            <Button disabled className="bg-green-600 text-white px-6 cursor-default">
              Смена идёт
            </Button>
          )}

          {isOnShift && (
            <div className="flex flex-col gap-1">
              {!isOnBreak ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => startBreakMut.mutate()}
                >
                  Перерыв
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => stopBreakMut.mutate()}
                >
                  Закончить перерыв
                </Button>
              )}

              <span className="text-xs text-gray-500 text-center">
                {isOnBreak ? formatSeconds(breakLeft) : "15:00"}
              </span>
            </div>
          )}
        </div>

        {isOnShift && (
          <Button
            variant="destructive"
            disabled={loading || hasInProgress}
            title={
              hasInProgress
                ? "Нельзя закончить смену, пока есть заказы в пути"
                : ""
            }
            onClick={() => stopShiftMut.mutate()}
          >
            Закончить смену
          </Button>
        )}
      </div>

      {isOnShift && !isOnBreak && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white"
              disabled={
                loading ||
                !hasInProgress ||
                isOutForDelivery ||
                tripDepartMut.isLoading
              }
              title={
                !hasInProgress
                  ? "Сначала возьмите хотя бы один заказ"
                  : isOutForDelivery
                    ? "Вы уже отметили выезд"
                    : ""
              }
              onClick={() => tripDepartMut.mutate()}
            >
              Выехал из пиццерии
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !isOutForDelivery || tripReturnMut.isLoading}
              title={
                !isOutForDelivery
                  ? "Нажмите после выезда, когда вернулись за новыми заказами"
                  : ""
              }
              onClick={() => tripReturnMut.mutate()}
            >
              На базе
            </Button>
          </div>
        </div>
      )}

      {/* Основная сетка */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Левая колонка */}
        <div className="space-y-4">
          {isOnShift && isOnBreak && (
            <p className="text-gray-500">Во время перерыва новые заказы не приходят.</p>
          )}

          {isOnShift && !isOnBreak && ordersLoading && (
            <p className="text-gray-500">Загружаем заказы…</p>
          )}

          {isOnShift && !isOnBreak && ordersError && (
            <p className="text-sm text-red-600 rounded-md border border-red-100 bg-red-50 px-3 py-2">
              Не удалось загрузить заказы: {ordersErrorDetail?.message ?? "ошибка сети или API"}.
            </p>
          )}

          {isOnShift && !isOnBreak && !ordersLoading && !ordersError && noOrdersFromApi && (
            <p className="text-gray-500">
              Нет доставок, назначенных на вас — в админке проверьте назначение курьера и статус
              заказа (кухня/сборка и т.д.).
            </p>
          )}

          {courierDeliveryCards.map((d, idx) => (
            <OrderCard
              key={d.id}
              title={`Заказ ${idx + 1}${
                d.queue_position != null ? ` · очередь ${d.queue_position}` : ""
              }`}
              d={d}
              onTake={(id) => takeOrderMut.mutate(id)}
              onComplete={(id) => completeOrderMut.mutate(id)}
              takeLoading={takeOrderMut.isLoading}
              completeLoading={completeOrderMut.isLoading}
              outForDelivery={isOutForDelivery}
            />
          ))}

          {/* (опционально) список 4 доступных */}
          {Array.isArray(queue) && queue.length > 0 && (
            <div className="border rounded-xl p-4 bg-white">
              <div className="font-semibold mb-2">Очередь (первые 4 доступны)</div>
              <div className="space-y-2">
                {queue.slice(0, 6).map((d) => (
                  <div key={d.id} className="text-sm flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        #{d.order_id} — {d.order?.delivery_address}
                      </div>
                      <div className="text-xs text-neutral-500">
                        queue: {d.queue_position ?? "-"} / {d.delivery_status}
                      </div>
                    </div>

                    {isAssignedStatus(d) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          !d.is_available_for_take ||
                          takeOrderMut.isLoading ||
                          isOutForDelivery
                        }
                        title={
                          isOutForDelivery
                            ? "Вернитесь на базу, чтобы брать новые заказы"
                            : undefined
                        }
                        onClick={() => takeOrderMut.mutate(d.id)}
                      >
                        Взять
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка */}
        <div className="space-y-3">
          <div className="text-sm text-neutral-600 flex flex-wrap gap-2 justify-end items-center">
            <span>
              Доступно: {Array.isArray(available) ? available.length : 0} / В пути:{" "}
              {Array.isArray(route) ? route.length : 0}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={mapFetching}
              onClick={() => refetchMap()}
            >
              {mapFetching ? "Обновление…" : "Обновить маршрут"}
            </Button>
          </div>

          {isOnShift && !isOnBreak && mapLoading && (
            <div className="text-sm text-neutral-500">Загружаем карту…</div>
          )}

          <CourierMap
            available={available}
            route={route}
            routePath={routePath}
            routingWarning={routingWarning}
          />
        </div>
      </div>
    </div>
  );
}
