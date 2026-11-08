import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/api/client";
import { isAdminUiA, isAdminUiB, isAdminUiC, isAdminUiD } from "@/config/adminUiVariant";
import {
  ShoppingCart,
  CalendarCheck,
  PackageCheck,
  Timer,
  MessageSquare,
} from "lucide-react";

function StatCardA({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  );
}

const STAT_CONFIG_B = [
  {
    key: "totalOrders",
    title: "Всего заказов",
    subtitle: "Все за время работы",
    icon: ShoppingCart,
    color: "text-[#78350F]",
    bg: "bg-[#FDE68A]",
  },
  {
    key: "todayOrders",
    title: "Заказы сегодня",
    subtitle: "По дате оформления",
    icon: CalendarCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "deliveredToday",
    title: "Доставлено сегодня",
    subtitle: "Со статусом «доставлен»",
    icon: PackageCheck,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "activeOrders",
    title: "Активные заказы",
    subtitle: "Принят / готовится / в пути",
    icon: Timer,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "pendingReviews",
    title: "Отзывов на модерации",
    subtitle: "Ещё не одобрены",
    icon: MessageSquare,
    color: "text-[#DC2626]",
    bg: "bg-red-50",
  },
];

const STAT_CONFIG_DARK = [
  {
    key: "totalOrders",
    title: "Всего заказов",
    subtitle: "Все за время работы",
    icon: ShoppingCart,
    color: "text-[#3B82F6]",
    bg: "bg-[#0F172A]",
  },
  {
    key: "todayOrders",
    title: "Заказы сегодня",
    subtitle: "По дате оформления",
    icon: CalendarCheck,
    color: "text-[#3B82F6]",
    bg: "bg-[#0F172A]",
  },
  {
    key: "deliveredToday",
    title: "Доставлено сегодня",
    subtitle: "Со статусом «доставлен»",
    icon: PackageCheck,
    color: "text-[#22C55E]",
    bg: "bg-[#0F172A]",
  },
  {
    key: "activeOrders",
    title: "Активные заказы",
    subtitle: "Принят / готовится / в пути",
    icon: Timer,
    color: "text-[#3B82F6]",
    bg: "bg-[#0F172A]",
  },
  {
    key: "pendingReviews",
    title: "Отзывов на модерации",
    subtitle: "Ещё не одобрены",
    icon: MessageSquare,
    color: "text-[#EF4444]",
    bg: "bg-[#0F172A]",
  },
];

function StatCardB({ title, value, subtitle, icon: Icon, color, bg }) {
  return (
    <div className="rounded-xl border border-[#FDE68A] bg-white p-5 flex items-start gap-4">
      <div className={`${bg} ${color} rounded-lg p-2.5 shrink-0`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCardD({ title, value, subtitle, icon: Icon, color, bg }) {
  return (
    <div className="rounded-xl border border-[#FDE68A] bg-white p-5 flex items-start gap-4">
      <div className={`${bg} ${color} rounded-lg p-2.5 shrink-0`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500 mb-1">{title}</div>
        <div className="text-2xl font-semibold text-gray-900">{value}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

const STAT_CONFIG_C = [
  {
    key: "totalOrders",
    title: "Всего заказов",
    subtitle: "Все за время работы",
    icon: ShoppingCart,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "text-[#16A34A]",
  },
  {
    key: "todayOrders",
    title: "Заказы сегодня",
    subtitle: "По дате оформления",
    icon: CalendarCheck,
    iconBg: "bg-[#E0F2FE]",
    iconColor: "text-[#3B82F6]",
  },
  {
    key: "deliveredToday",
    title: "Доставлено сегодня",
    subtitle: "Со статусом «доставлен»",
    icon: PackageCheck,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#8B5CF6]",
  },
  {
    key: "activeOrders",
    title: "Активные заказы",
    subtitle: "Принят / готовится / в пути",
    icon: Timer,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
  },
  {
    key: "pendingReviews",
    title: "Отзывов на модерации",
    subtitle: "Ещё не одобрены",
    icon: MessageSquare,
    iconBg: "bg-[#FEE2E2]",
    iconColor: "text-[#DC2626]",
  },
];

function StatCardC({ title, value, subtitle, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-xl border border-[#BBF7D0] bg-white p-5 flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} rounded-lg p-2.5 shrink-0`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-[#052E16]/70 mb-1">{title}</div>
        <div className="text-2xl font-semibold text-[#052E16]">{value}</div>
        {subtitle && <div className="text-xs text-[#052E16]/55 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

function StatCardDark({ title, value, subtitle, icon: Icon, color, bg }) {
  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#111827] p-5 flex items-start gap-4">
      <div className={`${bg} ${color} rounded-lg p-2.5 shrink-0`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-[#E5E7EB]/70 mb-1">{title}</div>
        <div className="text-2xl font-semibold text-[#E5E7EB]">{value}</div>
        {subtitle && <div className="text-xs text-[#E5E7EB]/50 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const isA = isAdminUiA();
  const isB = isAdminUiB();
  const isC = isAdminUiC();
  const isD = isAdminUiD();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) return <div className="text-gray-500">Загружаем дэшборд…</div>;

  if (error) {
    return <div className="text-[#DC2626]">Не удалось загрузить дэшборд: {error.message}</div>;
  }

  const { totalOrders, todayOrders, deliveredToday, activeOrders, pendingReviews } = data ?? {};

  if (isB) {
    return (
      <div className="text-[#E5E7EB]">
        <h1 className="text-2xl font-semibold mb-6">Панель администратора</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STAT_CONFIG_DARK.map((cfg) => (
            <StatCardDark
              key={cfg.key}
              title={cfg.title}
              subtitle={cfg.subtitle}
              value={data?.[cfg.key] ?? 0}
              icon={cfg.icon}
              color={cfg.color}
              bg={cfg.bg}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isC) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[#052E16] mb-6">Панель администратора</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STAT_CONFIG_C.map((cfg) => (
            <StatCardC
              key={cfg.key}
              title={cfg.title}
              subtitle={cfg.subtitle}
              value={data?.[cfg.key] ?? 0}
              icon={cfg.icon}
              iconBg={cfg.iconBg}
              iconColor={cfg.iconColor}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isD) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917] mb-6">
          Панель администратора
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STAT_CONFIG_B.map((cfg) => (
            <StatCardD
              key={cfg.key}
              title={cfg.title}
              subtitle={cfg.subtitle}
              value={data?.[cfg.key] ?? 0}
              icon={cfg.icon}
              color={cfg.color}
              bg={cfg.bg}
            />
          ))}
        </div>
      </div>
    );
  }

  // По умолчанию показываем текущий "желтый" вариант (это A)
  if (!isA) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#052E16] mb-6">
        Панель администратора
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-[#052E16]">
        {STAT_CONFIG_B.map((cfg) => (
          <StatCardB
            key={cfg.key}
            title={cfg.title}
            subtitle={cfg.subtitle}
            value={data?.[cfg.key] ?? 0}
            icon={cfg.icon}
            color={cfg.color}
            bg={cfg.bg}
          />
        ))}
      </div>
    </div>
  );
}
