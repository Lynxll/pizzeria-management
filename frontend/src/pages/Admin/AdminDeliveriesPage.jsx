import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronUp, ChevronDown, X } from "lucide-react";
import {
  adminGetDeliveriesQueue,
  adminUpdateDeliveryQueuePosition,
  adminReassignCourier,
  adminGetCouriers,
} from "@/api/client";
import { isAdminUiA, isAdminUiB, isAdminUiC, isAdminUiD } from "@/config/adminUiVariant";

function formatDuration(sec) {
  if (sec == null) return "-";
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SORT_MODES = {
  QUEUE: "queue",
  READY: "ready",
  CREATED: "created",
};

const SORT_OPTIONS_B = [
  { key: SORT_MODES.QUEUE, label: "Очереди" },
  { key: SORT_MODES.READY, label: 'Времени от "готов"' },
  { key: SORT_MODES.CREATED, label: "Времени от создания" },
];

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();

  const [sortMode, setSortMode] = useState(SORT_MODES.QUEUE);
  const isA = isAdminUiA();
  const isB = isAdminUiB();
  const isC = isAdminUiC();
  const isD = isAdminUiD();
  const [courierModal, setCourierModal] = useState({
    open: false,
    deliveryId: null,
    currentCourierId: null,
  });

  const {
    data: deliveries,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-deliveries-queue"],
    queryFn: adminGetDeliveriesQueue,
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ aId, aPos, bId, bPos }) => {
      await adminUpdateDeliveryQueuePosition(bId, aPos);
      await adminUpdateDeliveryQueuePosition(aId, bPos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-deliveries-queue"]);
    },
  });

  const reassignCourierMutation = useMutation({
    mutationFn: ({ deliveryId, courierId }) =>
      adminReassignCourier(deliveryId, courierId),
    onSuccess: () => {
      setCourierModal({ open: false, deliveryId: null, currentCourierId: null });
      queryClient.invalidateQueries(["admin-deliveries-queue"]);
    },
  });

  const {
    data: couriers,
    isLoading: couriersLoading,
    isError: couriersError,
  } = useQuery({
    queryKey: ["admin-couriers"],
    queryFn: adminGetCouriers,
    enabled: courierModal.open,
  });

  const sortedDeliveries = useMemo(() => {
    if (!deliveries) return [];
    const arr = deliveries.slice();

    switch (sortMode) {
      case SORT_MODES.READY:
        return arr.sort(
          (a, b) =>
            (b.waiting_seconds ?? 0) - (a.waiting_seconds ?? 0)
        );
      case SORT_MODES.CREATED:
        return arr.sort(
          (a, b) =>
            (b.order_waiting_seconds ?? 0) - (a.order_waiting_seconds ?? 0)
        );
      case SORT_MODES.QUEUE:
      default:
        return arr.sort((a, b) => {
          const qa = a.queue_position ?? 0;
          const qb = b.queue_position ?? 0;
          if (qa === qb) return a.id - b.id;
          return qa - qb;
        });
    }
  }, [deliveries, sortMode]);

  function moveInQueue(deliveryId, direction) {
    if (!sortedDeliveries || sortedDeliveries.length === 0) return;
    const index = sortedDeliveries.findIndex((d) => d.id === deliveryId);
    if (index === -1) return;

    const isUp = direction === "up";
    const neighbourIndex = isUp ? index - 1 : index + 1;
    if (neighbourIndex < 0 || neighbourIndex >= sortedDeliveries.length) return;

    const current = sortedDeliveries[index];
    const neighbour = sortedDeliveries[neighbourIndex];

    const aId = current.id;
    const bId = neighbour.id;
    const aPos = current.queue_position ?? 0;
    const bPos = neighbour.queue_position ?? 0;

    updatePositionMutation.mutate({ aId, aPos, bId, bPos });
  }

  function openCourierModal(delivery) {
    setCourierModal({
      open: true,
      deliveryId: delivery.id,
      currentCourierId: delivery.courier_id ?? null,
    });
  }

  function closeCourierModal() {
    if (reassignCourierMutation.isLoading) return;
    setCourierModal({ open: false, deliveryId: null, currentCourierId: null });
  }

  function handleCourierSelect(e) {
    setCourierModal((prev) => ({
      ...prev,
      currentCourierId: e.target.value ? Number(e.target.value) : null,
    }));
  }

  function handleCourierSave() {
    if (!courierModal.deliveryId || !courierModal.currentCourierId) return;
    reassignCourierMutation.mutate({
      deliveryId: courierModal.deliveryId,
      courierId: courierModal.currentCourierId,
    });
  }

  if (isA || isD) {
    return (
      <div className="space-y-6 text-[#052E16]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Доставки</h1>
          <Button
            variant="outline"
            className="border-[#FDE68A] text-[#052E16] hover:bg-[#FFFBEB] hover:border-[#F59E0B]"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Обновить
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#052E16]">Сортировать по:</span>
          {SORT_OPTIONS_B.map((opt) => (
            <Button
              key={opt.key}
              variant={sortMode === opt.key ? "default" : "outline"}
              size="sm"
              className={
                sortMode === opt.key
                  ? "bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold text-xs"
                  : "border-[#FDE68A] text-[#052E16] text-xs hover:bg-[#FFFBEB] hover:border-[#F59E0B]"
              }
              onClick={() => setSortMode(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading && <p className="text-gray-500">Загрузка очереди...</p>}
        {isError && <p className="text-[#DC2626]">Ошибка при загрузке очереди доставок.</p>}

        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FFFBEB]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#78350F] uppercase tracking-wider">
                    Очередь
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID дост.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID заказа
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Курьер
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    С &quot;готов&quot;
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    С создания
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {sortedDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      Нет заказов в очереди на доставку
                    </td>
                  </tr>
                ) : null}

                {sortedDeliveries.map((d, index) => (
                  <tr
                    key={d.id}
                    className="hover:bg-[#FFFBEB] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">
                      {d.queue_position ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">{d.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">{d.order_id}</td>
                    <td className="px-4 py-3 text-[#052E16]">
                      {d.order_contact_name || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#052E16]">{d.order_address}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-[#3B82F6] font-medium hover:text-[#052E16] text-xs transition-colors"
                        onClick={() => openCourierModal(d)}
                      >
                        {d.courier_id
                          ? `${d.courier_name || "Курьер"} (id: ${d.courier_id})`
                          : "Назначить"}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">
                      {formatDuration(d.waiting_seconds)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">
                      {formatDuration(d.order_waiting_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#FDE68A] hover:bg-[#FFFBEB] hover:border-[#F59E0B]"
                          disabled={index === 0 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "up")}
                          title="Выше в очереди"
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#FDE68A] hover:bg-[#FFFBEB] hover:border-[#F59E0B]"
                          disabled={index === sortedDeliveries.length - 1 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "down")}
                          title="Ниже в очереди"
                        >
                          <ChevronDown size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {courierModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-[#E5E7EB] text-[#052E16]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Переназначить курьера</h2>
                <button
                  type="button"
                  onClick={closeCourierModal}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {couriersLoading && <p className="text-gray-500">Загрузка курьеров...</p>}
              {couriersError && <p className="text-[#DC2626]">Ошибка при загрузке курьеров</p>}

              {!couriersLoading && !couriersError && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#052E16] mb-1.5">
                    Выберите курьера
                  </label>
                  <select
                    className="w-full border border-[#FDE68A] bg-white rounded-lg px-3 py-2.5 text-sm text-[#052E16] focus:outline-none focus:ring-[#F59E0B]/30 focus:border-[#F59E0B]"
                    value={courierModal.currentCourierId ?? ""}
                    onChange={handleCourierSelect}
                  >
                    <option value="">— Не выбрано —</option>
                    {couriers?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (id: {c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="border-[#E5E7EB] text-[#052E16]"
                  onClick={closeCourierModal}
                  disabled={reassignCourierMutation.isLoading}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold"
                  onClick={handleCourierSave}
                  disabled={!courierModal.currentCourierId || reassignCourierMutation.isLoading}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isC) {
    return (
      <div className="space-y-6 text-[#052E16]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Доставки</h1>
          <Button
            variant="outline"
            className="border-[#BBF7D0] bg-white text-[#052E16] hover:bg-[#BBF7D0]/30 hover:text-[#052E16]"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Обновить
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#052E16]">Сортировать по:</span>
          {SORT_OPTIONS_B.map((opt) => (
            <Button
              key={opt.key}
              variant={sortMode === opt.key ? "default" : "outline"}
              size="sm"
              className={
                sortMode === opt.key
                  ? "bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] font-semibold text-xs"
                  : "border-[#BBF7D0] bg-[#F0FDF4] text-[#052E16] text-xs hover:bg-[#BBF7D0]/30 hover:border-[#16A34A] hover:text-[#052E16]"
              }
              onClick={() => setSortMode(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading && <p className="text-[#052E16]/60">Загрузка очереди...</p>}
        {isError && <p className="text-[#DC2626]">Ошибка при загрузке очереди доставок.</p>}

        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-xl border border-[#BBF7D0] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#BBF7D0] bg-[#F0FDF4]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    Очередь
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    ID дост.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    ID заказа
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    Курьер
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    С &quot;готов&quot;
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    С создания
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16]/70 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#BBF7D0]">
                {sortedDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[#052E16]/50">
                      Нет заказов в очереди на доставку
                    </td>
                  </tr>
                ) : null}

                {sortedDeliveries.map((d, index) => (
                  <tr key={d.id} className="hover:bg-[#E8F5E9] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]/80">
                      {d.queue_position ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">
                      {d.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]">
                      {d.order_id}
                    </td>
                    <td className="px-4 py-3 text-[#052E16]">
                      {d.order_contact_name || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#052E16]">
                      {d.order_address}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-[#22C55E] font-medium hover:text-[#16A34A] text-xs transition-colors"
                        onClick={() => openCourierModal(d)}
                      >
                        {d.courier_id
                          ? `${d.courier_name || "Курьер"} (id: ${d.courier_id})`
                          : "Назначить"}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]/80">
                      {formatDuration(d.waiting_seconds)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#052E16]/80">
                      {formatDuration(d.order_waiting_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#BBF7D0] text-[#052E16] hover:bg-[#BBF7D0]/30 hover:text-[#052E16]"
                          disabled={index === 0 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "up")}
                          title="Выше в очереди"
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#BBF7D0] text-[#052E16] hover:bg-[#BBF7D0]/30 hover:text-[#052E16]"
                          disabled={index === sortedDeliveries.length - 1 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "down")}
                          title="Ниже в очереди"
                        >
                          <ChevronDown size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {courierModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-[#BBF7D0] text-[#052E16]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Переназначить курьера</h2>
                <button
                  type="button"
                  onClick={closeCourierModal}
                  className="text-[#052E16]/60 hover:text-[#052E16]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {couriersLoading && <p className="text-[#052E16]/60">Загрузка курьеров...</p>}
              {couriersError && <p className="text-[#DC2626]">Ошибка при загрузке курьеров</p>}

              {!couriersLoading && !couriersError && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#052E16] mb-1.5">
                    Выберите курьера
                  </label>
                  <select
                    className="w-full border border-[#BBF7D0] bg-white rounded-lg px-3 py-2.5 text-sm text-[#052E16] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E]"
                    value={courierModal.currentCourierId ?? ""}
                    onChange={handleCourierSelect}
                  >
                    <option value="">— Не выбрано —</option>
                    {couriers?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (id: {c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="border-[#BBF7D0] bg-white text-[#052E16] hover:bg-[#BBF7D0]/30 hover:border-[#16A34A]"
                  onClick={closeCourierModal}
                  disabled={reassignCourierMutation.isLoading}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] font-semibold"
                  onClick={handleCourierSave}
                  disabled={!courierModal.currentCourierId || reassignCourierMutation.isLoading}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isB) {
    return (
      <div className="space-y-6 text-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Доставки</h1>
          <Button
            variant="outline"
            className="border-[#1E293B] bg-[#0F172A] text-[#E5E7EB] hover:bg-[#1E293B]/60 hover:text-[#E5E7EB]"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} className="mr-1.5" />
            Обновить
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#E5E7EB]">Сортировать по:</span>
          {SORT_OPTIONS_B.map((opt) => (
            <Button
              key={opt.key}
              variant={sortMode === opt.key ? "default" : "outline"}
              size="sm"
              className={
                sortMode === opt.key
                  ? "bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB] font-semibold text-xs"
                  : "border-[#1E293B] bg-[#0F172A] text-[#E5E7EB] text-xs hover:bg-[#1E293B]/60 hover:text-[#E5E7EB]"
              }
              onClick={() => setSortMode(opt.key)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {isLoading && <p className="text-[#E5E7EB]/60">Загрузка очереди...</p>}
        {isError && <p className="text-[#EF4444]">Ошибка при загрузке очереди доставок.</p>}

        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#111827]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#0F172A]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    Очередь
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    ID дост.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    ID заказа
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    Клиент
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    Адрес
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    Курьер
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    С &quot;готов&quot;
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    С создания
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {sortedDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-[#E5E7EB]/60">
                      Нет заказов в очереди на доставку
                    </td>
                  </tr>
                ) : null}

                {sortedDeliveries.map((d, index) => (
                  <tr key={d.id} className="hover:bg-[#0F172A] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]/90">
                      {d.queue_position ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]">
                      {d.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]">
                      {d.order_id}
                    </td>
                    <td className="px-4 py-3 text-[#E5E7EB]">
                      {d.order_contact_name || "—"}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#E5E7EB]">
                      {d.order_address}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-[#3B82F6] font-medium hover:text-[#E5E7EB] text-xs transition-colors"
                        onClick={() => openCourierModal(d)}
                      >
                        {d.courier_id
                          ? `${d.courier_name || "Курьер"} (id: ${d.courier_id})`
                          : "Назначить"}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]/90">
                      {formatDuration(d.waiting_seconds)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]/90">
                      {formatDuration(d.order_waiting_seconds)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#1E293B] text-[#E5E7EB] hover:bg-[#1E293B]/40 hover:text-[#E5E7EB]"
                          disabled={index === 0 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "up")}
                          title="Выше в очереди"
                        >
                          <ChevronUp size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 border-[#1E293B] text-[#E5E7EB] hover:bg-[#1E293B]/40 hover:text-[#E5E7EB]"
                          disabled={index === sortedDeliveries.length - 1 || updatePositionMutation.isLoading}
                          onClick={() => moveInQueue(d.id, "down")}
                          title="Ниже в очереди"
                        >
                          <ChevronDown size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {courierModal.open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-[#111827] rounded-xl shadow-xl w-full max-w-md p-6 border border-[#1E293B] text-[#E5E7EB]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Переназначить курьера</h2>
                <button
                  type="button"
                  onClick={closeCourierModal}
                  className="text-[#E5E7EB]/60 hover:text-[#E5E7EB]"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {couriersLoading && <p className="text-[#E5E7EB]/60">Загрузка курьеров...</p>}
              {couriersError && <p className="text-[#EF4444]">Ошибка при загрузке курьеров</p>}

              {!couriersLoading && !couriersError && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">
                    Выберите курьера
                  </label>
                  <select
                    className="w-full border border-[#1E293B] bg-[#111827] rounded-lg px-3 py-2.5 text-sm text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
                    value={courierModal.currentCourierId ?? ""}
                    onChange={handleCourierSelect}
                  >
                    <option value="">— Не выбрано —</option>
                    {couriers?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (id: {c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  className="border-[#1E293B] text-[#E5E7EB] hover:bg-[#1E293B]/40"
                  onClick={closeCourierModal}
                  disabled={reassignCourierMutation.isLoading}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB] font-semibold"
                  onClick={handleCourierSave}
                  disabled={!courierModal.currentCourierId || reassignCourierMutation.isLoading}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Доставки</h1>
        <Button variant="outline" onClick={() => refetch()}>
          Обновить
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600 mr-2">Сортировать по:</span>
        <Button
          variant={sortMode === SORT_MODES.QUEUE ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode(SORT_MODES.QUEUE)}
        >
          Очереди
        </Button>
        <Button
          variant={sortMode === SORT_MODES.READY ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode(SORT_MODES.READY)}
        >
          Времени от "готов"
        </Button>
        <Button
          variant={sortMode === SORT_MODES.CREATED ? "default" : "outline"}
          size="sm"
          onClick={() => setSortMode(SORT_MODES.CREATED)}
        >
          Времени от создания
        </Button>
      </div>

      {isLoading && <p>Загрузка очереди...</p>}
      {isError && (
        <p className="text-red-600">Ошибка при загрузке очереди доставок.</p>
      )}

      {!isLoading && !isError && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left">Очередь</th>
                <th className="px-4 py-2 text-left">ID дост.</th>
                <th className="px-4 py-2 text-left">ID заказа</th>
                <th className="px-4 py-2 text-left">Клиент</th>
                <th className="px-4 py-2 text-left">Адрес</th>
                <th className="px-4 py-2 text-left">Курьер</th>
                <th className="px-4 py-2 text-left">Ожидает с "готов"</th>
                <th className="px-4 py-2 text-left">Ожидает с создания</th>
                <th className="px-4 py-2 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedDeliveries.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Нет заказов в очереди на доставку
                  </td>
                </tr>
              )}

              {sortedDeliveries.map((d, index) => (
                <tr
                  key={d.id}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2">{d.queue_position ?? "-"}</td>
                  <td className="px-4 py-2">{d.id}</td>
                  <td className="px-4 py-2">{d.order_id}</td>
                  <td className="px-4 py-2">
                    {d.order_contact_name || "—"}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {d.order_address}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => openCourierModal(d)}
                    >
                      {d.courier_id
                        ? `${d.courier_name || "Курьер"} (id: ${d.courier_id})`
                        : "Назначить"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {formatDuration(d.waiting_seconds)}
                  </td>
                  <td className="px-4 py-2">
                    {formatDuration(d.order_waiting_seconds)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={
                          index === 0 || updatePositionMutation.isLoading
                        }
                        onClick={() => moveInQueue(d.id, "up")}
                        title="Выше в очереди"
                      >
                        ↑
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={
                          index === sortedDeliveries.length - 1 ||
                          updatePositionMutation.isLoading
                        }
                        onClick={() => moveInQueue(d.id, "down")}
                        title="Ниже в очереди"
                      >
                        ↓
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка выбора курьера */}
      {courierModal.open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <h2 className="text-lg font-semibold mb-3">
              Переназначить курьера
            </h2>

            {couriersLoading && <p>Загрузка курьеров...</p>}
            {couriersError && (
              <p className="text-red-600">Ошибка при загрузке курьеров</p>
            )}

            {!couriersLoading && !couriersError && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Выберите курьера
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={courierModal.currentCourierId ?? ""}
                  onChange={handleCourierSelect}
                >
                  <option value="">— Не выбрано —</option>
                  {couriers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (id: {c.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={closeCourierModal}
                disabled={reassignCourierMutation.isLoading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCourierSave}
                disabled={
                  !courierModal.currentCourierId ||
                  reassignCourierMutation.isLoading
                }
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
