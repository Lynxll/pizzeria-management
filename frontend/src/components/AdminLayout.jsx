// src/components/AdminLayout.jsx
import { Outlet, Navigate, Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth-store";
import { ADMIN_UI_VARIANT } from "@/config/adminUiVariant";
import {
  LayoutGrid,
  Pizza,
  MessageSquare,
  ClipboardList,
  Truck,
  ArrowLeft,
} from "lucide-react";

function AdminNavLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        {
          const isNewDesign = ADMIN_UI_VARIANT === "B";
          if (isNewDesign) {
            return [
              "px-3 py-1.5 rounded-md text-sm text-left transition-colors",
              isActive
                ? "bg-[#EAB308] text-black"
                : "text-white/90 hover:bg-[#334155]",
            ].join(" ");
          }
          return [
            "px-3 py-1.5 rounded-md text-sm text-left",
            isActive ? "bg-black text-white" : "text-neutral-800 hover:bg-neutral-100",
          ].join(" ");
        }
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { isAuth, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const isThemeA = ADMIN_UI_VARIANT === "A";
  const isThemeB = ADMIN_UI_VARIANT === "B";
  const isThemeC = ADMIN_UI_VARIANT === "C";
  const isThemeD = ADMIN_UI_VARIANT === "D";
  const showBackToMenu = isThemeA || isThemeB || isThemeC || isThemeD;

  if (!isAuth()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-3">Доступ запрещён</h1>
        <p className="text-gray-600 mb-4">
          У вас нет прав для просмотра админ-панели.
        </p>
        <Link to="/" className="text-blue-600 hover:underline">
          На главную
        </Link>
      </div>
    );
  }

  if (isThemeA) {
    const navItems = [
      { to: "/admin", label: "Дэшборд", Icon: LayoutGrid },
      { to: "/admin/pizzas", label: "Пиццы / меню", Icon: Pizza },
      { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare },
      { to: "/admin/orders", label: "Заказы", Icon: ClipboardList },
      { to: "/admin/deliveries", label: "Доставки", Icon: Truck },
    ];

    return (
      <div className="min-h-screen flex items-stretch">
        <aside className="w-64 bg-[#1E293B] border-r border-[#334155] flex flex-col min-h-screen">
          {/* Header sidebar */}
          <div className="px-4 py-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#EAB308] flex items-center justify-center">
              <Pizza size={12} className="text-[#1E293B]" />
            </div>
            <div className="text-sm font-semibold text-white">Pizzeria Admin</div>
          </div>

          <div className="px-2 pb-3">
            <div className="h-px bg-[#334155]" />
          </div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-[#EAB308] text-black"
                      : "text-[#CBD5E1] hover:bg-[#334155]",
                  ].join(" ")
                }
              >
                <Icon size={16} />
                <span className="text-sm whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="px-4 pb-4 sticky bottom-0 bg-[#1E293B]">
            <div className="pt-4 border-t border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-[#EAB308] flex items-center justify-center text-[#EAB308] text-xs font-semibold">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">
                    Администратор
                  </div>
                  <div className="text-[10px] text-[#94A3B8] leading-tight">
                    Администратор
                  </div>
                </div>
              </div>
            </div>

            {showBackToMenu ? (
              <Link
                to="/menu"
                className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white"
              >
                <ArrowLeft size={14} />
                <span>Вернуться в меню</span>
              </Link>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 p-6 bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    );
  }

  if (isThemeB) {
    const navItems = [
      { to: "/admin", label: "Дэшборд", Icon: LayoutGrid },
      { to: "/admin/pizzas", label: "Пиццы / меню", Icon: Pizza },
      { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare },
      { to: "/admin/orders", label: "Заказы", Icon: ClipboardList },
      { to: "/admin/deliveries", label: "Доставки", Icon: Truck },
    ];

    return (
      <div className="min-h-screen flex items-stretch">
        <aside className="w-64 bg-[#020617] border-r border-[#1E293B] flex flex-col min-h-screen">
          <div className="px-4 py-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center">
              <Pizza size={12} className="text-[#E5E7EB]" />
            </div>
            <div className="text-sm font-semibold text-[#E5E7EB]">Pizzeria Admin</div>
          </div>

          <div className="px-2 pb-3">
            <div className="h-px bg-[#1E293B]" />
          </div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-[#3B82F6] text-[#E5E7EB]"
                      : "text-[#E5E7EB]/90 hover:bg-[#1E293B]",
                  ].join(" ")
                }
              >
                <Icon size={16} />
                <span className="text-sm whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="px-4 pb-4 sticky bottom-0 bg-[#020617]">
            <div className="pt-4 border-t border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-[#3B82F6] flex items-center justify-center text-[#3B82F6] text-xs font-semibold">
                  A
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#E5E7EB] leading-tight">
                    Администратор
                  </div>
                  <div className="text-[10px] text-[#94A3B8] leading-tight">
                    Администратор
                  </div>
                </div>
              </div>
            </div>

            {showBackToMenu ? (
              <Link
                to="/menu"
                className="mt-3 flex items-center gap-2 text-xs text-[#E5E7EB] hover:text-white"
              >
                <ArrowLeft size={14} />
                <span>Вернуться в меню</span>
              </Link>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 p-6 bg-[#0F172A] text-[#E5E7EB]">
          <Outlet />
        </main>
      </div>
    );
  }

  if (isThemeC) {
    const navItems = [
      { to: "/admin", label: "Дэшборд", Icon: LayoutGrid },
      { to: "/admin/pizzas", label: "Пиццы / меню", Icon: Pizza },
      { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare },
      { to: "/admin/orders", label: "Заказы", Icon: ClipboardList },
      { to: "/admin/deliveries", label: "Доставки", Icon: Truck },
    ];

    return (
      <div className="min-h-screen flex items-stretch">
        <aside className="w-64 bg-[#14532D] border-r border-[#BBF7D0] flex flex-col min-h-screen">
          <div className="px-4 py-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#22C55E] flex items-center justify-center">
              <Pizza size={12} className="text-[#14532D]" />
            </div>
            <div className="text-sm font-semibold text-[#F0FDF4]">
              Pizzeria Admin
            </div>
          </div>

          <div className="px-2 pb-3">
            <div className="h-px bg-[#BBF7D0]/40" />
          </div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-[#22C55E] text-[#052E16]"
                      : "text-[#BBF7D0]/90 hover:bg-[#16A34A] hover:text-[#F0FDF4]",
                  ].join(" ")
                }
              >
                <Icon size={16} />
                <span className="text-sm whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="px-4 pb-4 sticky bottom-0 bg-[#14532D]">
            <div className="pt-4 border-t border-[#BBF7D0]/40">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-[#BBF7D0] flex items-center justify-center text-[#F0FDF4] text-xs font-semibold">
                  C
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F0FDF4] leading-tight">
                    Администратор
                  </div>
                  <div className="text-[10px] text-[#BBF7D0] leading-tight">
                    Администратор
                  </div>
                </div>
              </div>
            </div>

            {showBackToMenu ? (
              <Link
                to="/menu"
                className="mt-3 flex items-center gap-2 text-xs text-[#BBF7D0] hover:text-[#F0FDF4]"
              >
                <ArrowLeft size={14} />
                <span>Вернуться в меню</span>
              </Link>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 p-6 bg-[#F0FDF4] text-[#052E16]">
          <Outlet />
        </main>
      </div>
    );
  }

  if (isThemeD) {
    const navItems = [
      { to: "/admin", label: "Дэшборд", Icon: LayoutGrid },
      { to: "/admin/pizzas", label: "Пиццы / меню", Icon: Pizza },
      { to: "/admin/reviews", label: "Отзывы", Icon: MessageSquare },
      { to: "/admin/orders", label: "Заказы", Icon: ClipboardList },
      { to: "/admin/deliveries", label: "Доставки", Icon: Truck },
    ];

    return (
      <div className="min-h-screen flex items-stretch">
        <aside className="w-64 bg-[#78350F] border-r border-[#FDE68A] flex flex-col min-h-screen">
          <div className="px-4 py-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#F59E0B] flex items-center justify-center">
              <Pizza size={12} className="text-[#1C1917]" />
            </div>
            <div className="text-sm font-semibold text-[#FFFBEB]">Pizzeria Admin</div>
          </div>

          <div className="px-2 pb-3">
            <div className="h-px bg-[#FDE68A]/40" />
          </div>

          <nav className="flex flex-col gap-1 px-2">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-[#F59E0B] text-[#1C1917]"
                      : "text-[#FDE68A] hover:bg-[#D97706] hover:text-[#FFFBEB]",
                  ].join(" ")
                }
              >
                <Icon size={16} />
                <span className="text-sm whitespace-nowrap">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="px-4 pb-4 sticky bottom-0 bg-[#78350F]">
            <div className="pt-4 border-t border-[#FDE68A]/40">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-[#FDE68A] bg-[#F59E0B] flex items-center justify-center text-[#1C1917] text-xs font-semibold">
                  D
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#FFFBEB] leading-tight">
                    Администратор
                  </div>
                  <div className="text-[10px] text-[#FDE68A] leading-tight">
                    Администратор
                  </div>
                </div>
              </div>
            </div>

            {showBackToMenu ? (
              <Link
                to="/menu"
                className="mt-3 flex items-center gap-2 text-xs text-[#FDE68A] hover:text-[#FFFBEB]"
              >
                <ArrowLeft size={14} />
                <span>Вернуться в меню</span>
              </Link>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 p-6 bg-[#FFFBEB] text-[#1C1917]">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] flex">
      {/* Левое меню */}
      <aside className="w-64 border-r bg-gray-50 p-4 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Админка</h2>
        <nav className="flex flex-col gap-2">
          <AdminNavLink to="/admin" end>
            Дэшборд
          </AdminNavLink>
          <AdminNavLink to="/admin/pizzas">Пиццы / меню</AdminNavLink>
          <AdminNavLink to="/admin/reviews">Отзывы</AdminNavLink>
          <AdminNavLink to="/admin/orders">Заказы</AdminNavLink>
          <AdminNavLink to="/admin/deliveries">Доставки</AdminNavLink>
        </nav>
      </aside>

      {/* Контент выбранного раздела */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
