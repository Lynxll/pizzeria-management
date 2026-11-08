// src/components/Header.jsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart-store";
import { useAuth } from "@/store/auth-store";
import { useEffect, useState } from "react";

function NavItem({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "px-3 py-1.5 rounded-md text-sm transition-colors",
          isActive
            ? "bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white shadow-[0_0_12px_rgba(220,38,38,0.35)]"
            : "text-[#C77D2B] hover:bg-[#FEE2E2]",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function Header() {
  const { itemsTotal } = useCart();
  const { isAuth, isAdmin, isCourier, isCook, user, logout, loadMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isCollector =
    Array.isArray(user?.roles) && user.roles.includes("Collector");

  const ordersTab = (() => {
    if (!isAuth()) return null;

    if (isAdmin()) return <NavItem to="/admin">Админка</NavItem>;
    if (isCourier()) return <NavItem to="/courier">Заказы</NavItem>;
    if (isCook()) return <NavItem to="/cook">Заказы</NavItem>;
    if (isCollector) return <NavItem to="/collector">Заказы</NavItem>;

    return null; 
  })();

  const navLinks = (
    <>
      <NavItem to="/menu" end>
        Меню
      </NavItem>
      <NavItem to="/discounts">Акции</NavItem>
      <NavItem to="/reviews">Отзывы</NavItem>
      <NavItem to="/contacts">Контакты</NavItem>
      {ordersTab}
    </>
  );

  const headerStyle = isMobileMenuOpen
    ? {
        backgroundColor: "rgba(255, 245, 245, 0.96)",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,245,245,0.94) 52%, rgba(254,226,226,0.72) 100%)",
        backgroundBlendMode: "normal",
      }
    : {
        backgroundColor: "rgba(255, 245, 245, 0.92)",
        backgroundImage: `
          linear-gradient(90deg, rgba(255, 245, 245, 0.98) 0%, rgba(255, 245, 245, 0) 10%, rgba(255, 245, 245, 0) 90%, rgba(255, 245, 245, 0.98) 100%),
          repeating-linear-gradient(
            0deg,
            rgba(127, 29, 29, 0.11) 0px 1px,
            transparent 1px 6px
          ),
          repeating-linear-gradient(
            0deg,
            transparent 0px 2px,
            rgba(127, 29, 29, 0.08) 2px 3px,
            transparent 3px 8px
          ),
          radial-gradient(120% 85% at -8% 50%, rgba(255, 245, 245, 1) 0 38%, rgba(255, 245, 245, 0) 60%),
          radial-gradient(120% 85% at 108% 50%, rgba(255, 245, 245, 1) 0 38%, rgba(255, 245, 245, 0) 60%),
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.65) 0%,
            rgba(255, 245, 245, 0.9) 45%,
            rgba(254, 226, 226, 0.75) 100%
          )
        `,
        backgroundBlendMode: "normal, normal, normal, normal, normal, normal",
      };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[#FECACA]/80 backdrop-blur relative overflow-hidden shadow-[0_4px_14px_rgba(127,29,29,0.08)]"
      style={headerStyle}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isMobileMenuOpen
            ? "radial-gradient(62% 112% at 50% -6%, rgba(250, 204, 21, 0.24) 0%, rgba(250, 204, 21, 0.12) 30%, rgba(250, 204, 21, 0.045) 52%, rgba(250, 204, 21, 0) 78%)"
            : "radial-gradient(42% 160% at 50% 52%, rgba(250, 204, 21, 0.27) 0%, rgba(250, 204, 21, 0.13) 28%, rgba(250, 204, 21, 0.045) 52%, rgba(250, 204, 21, 0) 78%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto hidden h-14 max-w-6xl grid-cols-3 items-center px-4 md:grid">
        {/* Лого */}
        <div className="justify-self-start">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold tracking-tight text-[#7F1D1D]">
            <span
              className="inline-grid h-7 w-7 place-items-center rounded-full bg-[#F87171] text-[11px] font-bold text-white shadow-sm"
              aria-hidden
            >
              PZ
            </span>
            Пиццерия
          </Link>
        </div>

        {/* Центр навигации */}
        <nav className="justify-self-center flex items-center gap-2">
          {navLinks}
        </nav>

        {/* Правый блок */}
        <div className="justify-self-end flex items-center gap-1">
          {!isAuth() ? (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-sm px-3">
                  Войти
                </Button>
              </Link>
              <Link to="/login" state={{ tab: "register" }}>
                <Button
                  variant="default"
                  className="text-sm px-3 bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                >
                  Регистрация
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile">
                <Button
                  variant="ghost"
                  className="px-2"
                  title={user?.name || "Профиль"}
                >
                  👤
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="text-sm px-3 text-[#C77D2B] hover:bg-[#FEE2E2]"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Выйти
              </Button>
            </>
          )}

          {/* Корзина */}
          <Link to="/cart" className="relative">
            <Button variant="ghost" className="px-2" title="Корзина">
              🛒
            </Button>
            {itemsTotal > 0 && (
              <span className="absolute -top-1 -right-1 text-[11px] px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                {itemsTotal}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-3 md:hidden">
        <Link to="/" className="inline-flex min-w-0 items-center gap-2 font-semibold tracking-tight text-[#7F1D1D]">
          <span
            className="inline-grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F87171] text-[11px] font-bold text-white shadow-sm"
            aria-hidden
          >
            PZ
          </span>
          <span className="truncate">Пиццерия</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/cart" className="relative">
            <Button variant="ghost" className="px-2" title="Корзина">
              🛒
            </Button>
            {itemsTotal > 0 && (
              <span className="absolute -top-1 -right-1 text-[11px] px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                {itemsTotal}
              </span>
            )}
          </Link>
          <Button
            type="button"
            variant="ghost"
            className="px-2 text-lg"
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-[#FECACA]/80 bg-[#FFF5F5]/95 px-3 pb-3 pt-2 md:hidden">
          <nav className="grid grid-cols-2 gap-2">{navLinks}</nav>

          <div className="mt-3 border-t border-[#FECACA]/70 pt-3">
            {!isAuth() ? (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1">
                  <Button variant="ghost" className="w-full text-sm">
                    Войти
                  </Button>
                </Link>
                <Link to="/login" state={{ tab: "register" }} className="flex-1">
                  <Button
                    variant="default"
                    className="w-full text-sm bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                  >
                    Регистрация
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/profile" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-[#C77D2B] hover:bg-[#FEE2E2]"
                    title={user?.name || "Профиль"}
                  >
                    Профиль
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="flex-1 text-sm text-[#C77D2B] hover:bg-[#FEE2E2]"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Выйти
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
