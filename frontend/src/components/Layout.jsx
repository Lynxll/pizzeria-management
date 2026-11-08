import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import OrderStatusBanner from "./OrderStatusBanner";
import { useActiveOrder } from "@/hooks/useActiveOrder";
import { shouldShowOrderBanner } from "@/lib/orderBannerVisibility";

function shouldHideHeader(pathname) {
  // В новом SaaS-дизайне хедер скрываем на ВСЕХ админ-вкладках.
  // (и дэшборд тоже: /admin)
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function Layout() {
  const { pathname } = useLocation();
  const { activeOrder } = useActiveOrder();
  const hideHeader = shouldHideHeader(pathname);
  const showOrderBanner = shouldShowOrderBanner(pathname, activeOrder);
  const isTexturedPage =
    pathname === "/reviews" || pathname.startsWith("/orders/");

  return (
    <>
      {!hideHeader ? <Header /> : null}
      {showOrderBanner ? <OrderStatusBanner order={activeOrder} /> : null}
      <div className={`${hideHeader ? "" : "pt-14"} ${isTexturedPage ? "bg-[#F9F6EF]" : ""}`}>
        {/* отступ под фикс-хедер */}
        <Outlet />
      </div>
    </>
  );
}
