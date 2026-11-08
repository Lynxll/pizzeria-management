import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetReviews,
  adminApproveReview,
  adminDeleteReviewAdmin,
} from "@/api/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { isAdminUiA, isAdminUiB, isAdminUiC, isAdminUiD } from "@/config/adminUiVariant";
import { Check, Trash2 } from "lucide-react";

function RatingStars({ value }) {
  const v = Number(value) || 0;
  return (
    <span className="text-[#FBBF24]">
      {"★".repeat(v)}
      <span className="text-gray-300">{"★".repeat(Math.max(0, 5 - v))}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [onlyPending, setOnlyPending] = useState(true);
  const isA = isAdminUiA();
  const isB = isAdminUiB();
  const isC = isAdminUiC();
  const isD = isAdminUiD();
  // Используется только в оставшемся fallback-коде ниже (при A/B значениях выше мы до него не доходим).
  const isNewDesign = isA || isD;

  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-reviews", { onlyPending }],
    queryFn: () => adminGetReviews(onlyPending),
  });

  const approveMut = useMutation({
    mutationFn: (id) => adminApproveReview(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-reviews"]);
      qc.invalidateQueries(["admin-dashboard"]); 
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminDeleteReviewAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries(["admin-reviews"]);
      qc.invalidateQueries(["admin-dashboard"]);
    },
  });

  if (isLoading) {
    return <div className="text-gray-600">Загружаем отзывы…</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Не удалось загрузить отзывы: {error.message}
      </div>
    );
  }

  if (isA || isD) {
    return (
      <div className="space-y-6 text-[#1C1917]">
        <h1 className="text-2xl font-semibold">Отзывы</h1>

        <label className="inline-flex items-center gap-2 text-sm text-[#78350F]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#FDE68A] text-[#F59E0B] focus:ring-[#F59E0B]"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Показывать только не одобренные
        </label>

        <div className="overflow-x-auto rounded-xl border border-[#FDE68A] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#FDE68A] bg-[#FFFBEB]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#78350F] uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Заказ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата заказа</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Рейтинг</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Комментарий</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FDE68A]">
              {reviews?.map((r) => (
                <tr key={r.id} className="hover:bg-[#FFFBEB] transition-colors align-top">
                  <td className="px-4 py-3 text-[#92400E] font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${r.order_id}`}
                      className="font-medium hover:underline transition-colors"
                    >
                      Заказ #{r.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1C1917]">{r.customer_name}</td>
                  <td className="px-4 py-3 text-[#92400E]">{new Date(r.order_date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <RatingStars value={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-md text-[#1C1917]">
                    {r.comment || <span className="text-[#6b7280]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.is_approved ? (
                      <span className="inline-flex items-center rounded-full bg-[#DCFCE7] text-[#166534] px-2.5 py-0.5 text-xs font-medium">
                        одобрен
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#FEF9C3] text-[#854D0E] px-2.5 py-0.5 text-xs font-medium">
                        ожидает модерации
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!r.is_approved && (
                        <Button
                          size="sm"
                          className="text-xs bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold"
                          disabled={approveMut.isPending}
                          onClick={() => approveMut.mutate(r.id)}
                        >
                          <Check size={14} className="mr-1" />
                          Одобрить
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="text-xs text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                        variant="ghost"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm("Удалить этот отзыв?")) {
                            deleteMut.mutate(r.id);
                          }
                        }}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!reviews?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Отзывов нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isB) {
    return (
      <div className="space-y-6 text-[#E5E7EB]">
        <h1 className="text-2xl font-semibold">Отзывы</h1>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#1E293B] text-[#3B82F6] focus:ring-[#3B82F6]"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Показывать только не одобренные
        </label>

        <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#111827]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0F172A]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Заказ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Клиент</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Дата заказа</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Рейтинг</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Комментарий</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#E5E7EB]/70 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {reviews?.map((r) => (
                <tr key={r.id} className="hover:bg-[#0F172A] transition-colors align-top">
                  <td className="px-4 py-3 text-[#E5E7EB]/80 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${r.order_id}`}
                      className="text-[#3B82F6] font-medium hover:underline"
                    >
                      Заказ #{r.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.customer_name}</td>
                  <td className="px-4 py-3 text-[#E5E7EB]/80">{new Date(r.order_date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <RatingStars value={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-md text-[#E5E7EB]/80">
                    {r.comment || <span className="text-[#94A3B8]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.is_approved ? (
                      <span className="inline-flex items-center rounded-full bg-[#22C55E]/20 text-[#22C55E] px-2.5 py-0.5 text-xs font-medium">
                        одобрен
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#3B82F6]/20 text-[#3B82F6] px-2.5 py-0.5 text-xs font-medium">
                        ожидает модерации
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!r.is_approved && (
                        <Button
                          size="sm"
                          className="text-xs bg-[#3B82F6] hover:bg-[#2563EB] text-[#E5E7EB] font-semibold"
                          disabled={approveMut.isPending}
                          onClick={() => approveMut.mutate(r.id)}
                        >
                          <Check size={14} className="mr-1" />
                          Одобрить
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="text-xs text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                        variant="ghost"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm("Удалить этот отзыв?")) deleteMut.mutate(r.id);
                        }}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!reviews?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#94A3B8]">
                    Отзывов нет.
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
        <h1 className="text-2xl font-semibold">Отзывы</h1>

        <label className="inline-flex items-center gap-2 text-sm text-[#052E16]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#BBF7D0] text-[#22C55E] focus:ring-[#22C55E]"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
          />
          Показывать только не одобренные
        </label>

        <div className="overflow-x-auto rounded-xl border border-[#BBF7D0] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#BBF7D0] bg-[#F0FDF4]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Заказ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Дата заказа
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Рейтинг
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#052E16] uppercase tracking-wider">
                  Комментарий
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
              {reviews?.map((r) => (
                <tr key={r.id} className="hover:bg-[#E8F5E9] transition-colors align-top">
                  <td className="px-4 py-3 text-[#052E16] font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/orders/${r.order_id}`}
                      className="text-[#052E16] font-medium hover:text-[#16A34A] transition-colors"
                    >
                      Заказ #{r.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#052E16]">{r.customer_name}</td>
                  <td className="px-4 py-3 text-[#052E16]">
                    {new Date(r.order_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <RatingStars value={r.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-md text-[#052E16]">
                    {r.comment || <span className="text-[#052E16]/50">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.is_approved ? (
                      <span className="inline-flex items-center rounded-full bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 text-xs font-medium">
                        одобрен
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#BBF7D0] text-[#052E16] px-2.5 py-0.5 text-xs font-medium">
                        ожидает модерации
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!r.is_approved && (
                        <Button
                          size="sm"
                          className="text-xs bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] font-semibold"
                          disabled={approveMut.isPending}
                          onClick={() => approveMut.mutate(r.id)}
                        >
                          <Check size={14} className="mr-1" />
                          Одобрить
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="text-xs text-[#DC2626] hover:bg-[#BBF7D0]/30 hover:text-[#DC2626]"
                        variant="ghost"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm("Удалить этот отзыв?")) deleteMut.mutate(r.id);
                        }}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!reviews?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#052E16]/50">
                    Отзывов нет.
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Отзывы</h1>
      <div className="text-[#94A3B8]">Неверный дизайн-конфиг. Переключите ADMIN_UI_VARIANT.</div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={onlyPending}
          onChange={(e) => setOnlyPending(e.target.checked)}
        />
        Показывать только не одобренные
      </label>

      <div
        className={[
          "overflow-x-auto rounded-xl border bg-white",
          isNewDesign ? "border-[#E5E7EB]" : "",
        ].join(" ")}
      >
        <table className="min-w-full text-sm">
          <thead className={isNewDesign ? "bg-[#F1F5F9]" : "bg-gray-50"}>
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Заказ</th>
              <th className="px-3 py-2 text-left">Клиент</th>
              <th className="px-3 py-2 text-left">Дата заказа</th>
              <th className="px-3 py-2 text-left">Рейтинг</th>
              <th className="px-3 py-2 text-left">Комментарий</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {reviews?.map((r) => (
              <tr
                key={r.id}
                className={["border-t align-top", isNewDesign ? "border-[#E5E7EB]" : ""].join(" ")}
              >
                <td className="px-3 py-2 text-gray-500">{r.id}</td>
                <td className="px-3 py-2">
                  <Link
                    to={`/orders/${r.order_id}`}
                    className={isNewDesign ? "text-[#3B82F6] hover:underline" : "text-blue-600 hover:underline"}
                  >
                    Заказ #{r.order_id}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.customer_name}</td>
                <td className="px-3 py-2">
                  {new Date(r.order_date).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <RatingStars value={r.rating} />
                </td>
                <td className="px-3 py-2 max-w-md">
                  {r.comment || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-3 py-2">
                  {r.is_approved ? (
                    <span className="text-green-600 text-xs font-medium">
                      одобрен
                    </span>
                  ) : (
                    <span className="text-orange-600 text-xs font-medium">
                      ожидает модерации
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  {!r.is_approved && (
                    <Button
                      size="sm"
                      className="text-xs"
                      variant="default"
                      {...(isNewDesign
                        ? {
                            className:
                              "text-xs bg-[#F59E0B] text-black hover:bg-[#D97706]",
                          }
                        : {})}
                      disabled={approveMut.isPending}
                      onClick={() => approveMut.mutate(r.id)}
                    >
                      Одобрить
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="text-xs"
                    variant="ghost"
                    {...(isNewDesign
                      ? {
                          className:
                            "text-xs text-[#DC2626] hover:bg-[#334155] hover:text-white",
                        }
                      : {})}
                    disabled={deleteMut.isPending}
                    onClick={() => {
                      if (confirm("Удалить этот отзыв?")) {
                        deleteMut.mutate(r.id);
                      }
                    }}
                  >
                    Удалить
                  </Button>
                </td>
              </tr>
            ))}

            {!reviews?.length && (
              <tr>
                <td
                  className="px-3 py-4 text-center text-gray-500"
                  colSpan={8}
                >
                  Отзывов нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
