import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetOrders } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { isAdminUiA, isAdminUiB, isAdminUiC } from "@/config/adminUiVariant";

const ACTIVE_STATUS_SET = new Set(["принят", "готовится", "в пути"]);

const STATUS_LABELS = {
  "принят": "Принят",
  "готовится": "Готовится",
  "в пути": "В пути",
  "доставлен": "Доставлен",
  "отменен": "Отменён",
};

const STATUS_STYLES = {
  "принят": "bg-[#DCFCE7] text-[#166534]",
  "готовится": "bg-[#FEF9C3] text-[#854D0E]",
  "в пути": "bg-[#E0F2FE] text-[#1D4ED8]",
  "доставлен": "bg-[#BBF7D0] text-[#166534]",
  "отменен": "bg-[#FEE2E2] text-[#DC2626]",
};

const STATUS_STYLES_DARK = {
  "принят": "bg-[#22C55E]/20 text-[#22C55E]",
  "готовится": "bg-[#22C55E]/20 text-[#22C55E]",
  "в пути": "bg-[#3B82F6]/20 text-[#3B82F6]",
  "доставлен": "bg-[#22C55E]/20 text-[#22C55E]",
  "отменен": "bg-[#EF4444]/20 text-[#EF4444]",
};

const STATUS_STYLES_C = {
  "принят": "bg-[#DCFCE7] text-[#16A34A]",
  "готовится": "bg-[#DCFCE7] text-[#16A34A]",
  "в пути": "bg-[#DCFCE7] text-[#16A34A]",
  "доставлен": "bg-[#BBF7D0] text-[#052E16]",
  "отменен": "bg-[#FEE2E2] text-[#DC2626]",
};

function isActiveStatus(status) {
  if (!status) return false;
  return ACTIVE_STATUS_SET.has(status.toLowerCase());
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleString();
}

export default function AdminOrdersPage() {
  const [onlyActive, setOnlyActive] = useState(true);
  const isA = isAdminUiA();
  const isB = isAdminUiB();
  const isC = isAdminUiC();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => adminGetOrders({ page: 1, pageSize: 50 }),
  });

  const items = data?.items || [];

  const filtered = onlyActive
    ? items.filter((o) => isActiveStatus(o.status))
    : items;

  if (isLoading) {
    return <div className="text-gray-500">Загружаем заказы…</div>;
  }

  if (error) {
    return (
      <div className={isB || isC ? "text-[#DC2626]" : "text-red-600"}>
        Не удалось загрузить заказы: {error.message}
      </div>
    );
  }

  if (isB) {
    return (
      <div className="space-y-4 text-[#E5E7EB]">
        <h1 className="text-2xl font-semibold">Заказы</h1>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Показывать только активные (принят / готовится / в пути)
        </label>

        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#111827]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#111827]">
              <tr>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">ID</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Дата</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Клиент</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Адрес</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Сумма</th>
                <th className="px-3 py-2 text-left text-[#E5E7EB]/70">Статус</th>
                <th className="px-3 py-2 text-right text-[#E5E7EB]/70">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filtered.map((o) => {
                const amount =
                  o.finance?.total_after_discount ??
                  o.finance?.items_total ??
                  o.total_amount ??
                  0;

                const rawStatus = (o.status || "").toLowerCase();
                const statusLabel = STATUS_LABELS[rawStatus] ?? o.status;
                const statusStyle = STATUS_STYLES_DARK[rawStatus] ?? "bg-[#1E293B] text-[#E5E7EB]";

                return (
                  <tr key={o.id} className="border-t align-top hover:bg-[#0F172A]">
                    <td className="px-3 py-2 text-[#E5E7EB]/70">{o.id}</td>
                    <td className="px-3 py-2 text-[#E5E7EB]">{formatDate(o.order_date)}</td>
                    <td className="px-3 py-2 text-[#E5E7EB]">{o.customer_name}</td>
                    <td className="px-3 py-2 max-w-md text-[#E5E7EB]">
                      <span className="block truncate" title={o.delivery_address}>
                        {o.delivery_address}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#E5E7EB]">{amount} ₽</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link to={`/orders/${o.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#1E293B] text-[#3B82F6] hover:bg-[#1E293B]/40"
                        >
                          Подробнее
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-[#E5E7EB]/60">
                    Заказов нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isC) {
    return (
      <div className="space-y-6 text-[#052E16]">
        <h1 className="text-2xl font-semibold text-[#052E16]">Заказы</h1>

        <label className="inline-flex items-center gap-2 text-sm text-[#052E16]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#BBF7D0] text-[#22C55E] focus:ring-[#22C55E]"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          Показывать только активные (принят / готовится / в пути)
        </label>

        <div className="overflow-x-auto rounded-xl border border-[#BBF7D0] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#BBF7D0] bg-[#F0FDF4]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Дата заказа
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Адрес
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#BBF7D0]">
              {filtered.map((o) => {
                const amount =
                  o.finance?.total_after_discount ??
                  o.finance?.items_total ??
                  o.total_amount ??
                  0;

                const rawStatus = (o.status || "").toLowerCase();
                const statusLabel = STATUS_LABELS[rawStatus] ?? o.status;
                const statusStyle =
                  STATUS_STYLES_C[rawStatus] ?? "bg-gray-100 text-gray-600";

                return (
                  <tr key={o.id} className="hover:bg-[#E8F5E9] transition-colors align-top">
                    <td className="px-4 py-3 text-[#052E16] font-mono text-xs">{o.id}</td>
                    <td className="px-4 py-3 text-[#052E16] font-medium">{formatDate(o.order_date)}</td>
                    <td className="px-4 py-3 text-[#052E16] font-medium">{o.customer_name}</td>
                    <td className="px-4 py-3 max-w-md">
                      <span className="block truncate text-[#052E16]" title={o.delivery_address}>
                        {o.delivery_address}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#052E16] font-medium">{amount} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/orders/${o.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#BBF7D0] text-[#052E16] hover:bg-[#BBF7D0]/40 hover:border-[#16A34A]"
                        >
                          <ExternalLink size={14} className="mr-1.5" />
                          Подробнее
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Заказов нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1C1917]">
      <h1 className="text-2xl font-semibold text-[#052E16]">Заказы</h1>

      <label className="inline-flex items-center gap-2 text-sm text-[#78350F]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[#FDE68A] text-[#F59E0B] focus:ring-[#F59E0B]"
          checked={onlyActive}
          onChange={(e) => setOnlyActive(e.target.checked)}
        />
        Показывать только активные (принят / готовится / в пути)
      </label>

      <div className="overflow-x-auto rounded-xl border border-[#FDE68A] bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#FDE68A] bg-[#FFFBEB]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#78350F] uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Дата заказа
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Клиент
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Адрес
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FDE68A]">
            {filtered.map((o) => {
              const amount =
                o.finance?.total_after_discount ??
                o.finance?.items_total ??
                o.total_amount ??
                0;

              const rawStatus = (o.status || "").toLowerCase();
              const statusLabel = STATUS_LABELS[rawStatus] ?? o.status;
              const statusStyle = STATUS_STYLES[rawStatus] ?? "bg-gray-100 text-gray-600";

              return (
                <tr key={o.id} className="hover:bg-[#F0FDF4] transition-colors align-top">
                  <td className="px-4 py-3 text-[#052E16] font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-3 text-[#052E16] font-medium">{formatDate(o.order_date)}</td>
                  <td className="px-4 py-3 text-[#052E16] font-medium">{o.customer_name}</td>
                  <td className="px-4 py-3 max-w-md">
                    <span className="block truncate text-[#052E16]" title={o.delivery_address}>
                      {o.delivery_address}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#052E16] font-medium">{amount} ₽</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${o.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-[#FDE68A] text-[#052E16] hover:bg-[#FFFBEB] hover:border-[#F59E0B]"
                      >
                        <ExternalLink size={14} className="mr-1.5" />
                        Подробнее
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}

            {!filtered.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Заказов нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
