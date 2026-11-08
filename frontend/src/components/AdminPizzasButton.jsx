import { Link, useLocation } from "react-router-dom";

export default function AdminPizzasButton() {
  const { pathname } = useLocation();
  const active = pathname.startsWith("/pizzas");

  return (
    <Link
      to="/pizzas"
      className={
        "fixed z-40 left-4 top-20 px-3 py-2 rounded-xl shadow " +
        (active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-800 hover:bg-gray-100 border")
      }
      title="Go to Pizzas"
    >
      Pizzas
    </Link>
  );
}
