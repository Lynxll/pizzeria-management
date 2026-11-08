import { Link } from "react-router-dom";
import { ChefHat, Package, Truck, ClipboardCheck, ChevronRight } from "lucide-react";
import {
  getOrderBannerCopy,
  normalizeOrderStatus,
  STATUS_BANNER_STYLES,
} from "@/lib/orderStatus";

const STATUS_ICONS = {
  принят: ClipboardCheck,
  готовится: ChefHat,
  назначен: Package,
  готов: Package,
  "в пути": Truck,
};

export default function OrderStatusBanner({ order }) {
  if (!order?.id) return null;

  const status = normalizeOrderStatus(order.status);
  const { title, hint } = getOrderBannerCopy(order.status);
  const styles = STATUS_BANNER_STYLES[status] ?? STATUS_BANNER_STYLES["принят"];
  const Icon = STATUS_ICONS[status] ?? Package;

  return (
    <Link
      to={`/orders/${order.id}`}
      className={[
        "sticky top-14 z-30 block w-full border-b px-4 py-2.5 transition-colors hover:brightness-[0.98]",
        styles,
      ].join(" ")}
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-sm"
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight">
            {title}
            <span className="font-normal opacity-80"> · №{order.id}</span>
          </div>
          <div className="truncate text-xs opacity-85">{hint}</div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium opacity-90">
          Подробнее
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
