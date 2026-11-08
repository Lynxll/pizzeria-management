import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MenuLayout() {
  const { pathname } = useLocation();
  const value = pathname.includes("/snacks")
    ? "snacks"
    : pathname.includes("/drinks")
    ? "drinks"
    : "pizzas";

  return (
    <div>
      <div className="sticky top-14 z-40 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs value={value} className="w-full">
            <TabsList className="h-11">
              <NavLink to="pizzas"><TabsTrigger value="pizzas">Pizzas</TabsTrigger></NavLink>
              <NavLink to="snacks"><TabsTrigger value="snacks">Snacks</TabsTrigger></NavLink>
              <NavLink to="drinks"><TabsTrigger value="drinks">Drinks</TabsTrigger></NavLink>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
