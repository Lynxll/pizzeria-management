import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import MenuLayout from "@/pages/Menu/_MenuLayout.jsx";
import PizzasList from "@/pages/Menu/Pizzas/List.jsx";

import CartPage from "@/pages/Cart/Cart";
import ProfilePage from "@/pages/Profile/ProfilePage";
import OrderDetailsPage from "@/pages/Orders/OrderDetailsPage";
import CheckoutPage from "@/pages/Checkout/Checkout";

import AuthPage from "@/pages/Auth";
import ProtectedRoute from "@/lib/ProtectedRoute";

import Contacts from "@/pages/Contacts/Contacts";
import ReviewsPage from "@/pages/Reviews/ReviewsPage.jsx";

import AdminLayout from "@/components/AdminLayout.jsx";
import AdminDashboard from "@/pages/Admin/AdminDashboard.jsx";
import AdminPizzasPage from "@/pages/Admin/AdminPizzasPage.jsx";
import AdminReviewsPage from "@/pages/Admin/AdminReviewsPage.jsx";
import AdminOrderPage from "@/pages/Admin/AdminOrderPage.jsx";
import AdminDeliveriesPage from "@/pages/Admin/AdminDeliveriesPage.jsx";

import CourierPage from "@/pages/CourierPage";
import CookPage from "@/pages/CookPage.jsx";
import CollectorPage from "@/pages/CollectorPage.jsx";



const Stub = ({ title }) => (
  <div className="max-w-6xl mx-auto px-4 py-6 text-gray-600">{title}</div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/menu" replace />} />

        {/* Меню */}
        <Route path="/menu" element={<MenuLayout />}>
          <Route index element={<Navigate to="pizzas" replace />} />
          <Route path="pizzas" element={<PizzasList />} />
          <Route path="snacks" element={<Stub title="Snacks — coming soon" />} />
          <Route path="drinks" element={<Stub title="Drinks — coming soon" />} />
        </Route>

        {/* Общие страницы */}
        <Route path="/discounts" element={<Stub title="Discounts" />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contacts" element={<Contacts />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />

        {/* любой залогиненный пользователь */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        {/* Корзина и детали заказа */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />

        {/* админка*/}
        <Route element={<ProtectedRoute roles={["Admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pizzas" element={<AdminPizzasPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="orders" element={<AdminOrderPage />} />
            <Route path="deliveries" element={<AdminDeliveriesPage />} />
          </Route>
        </Route>

        {/* курьер */}
        <Route element={<ProtectedRoute roles={["Courier"]} />}>
          <Route path="/courier" element={<CourierPage />} />
        </Route>
        
        <Route element={<ProtectedRoute roles={["Cook"]} />}>
          <Route path="/cook" element={<CookPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["Collector"]} />}>
          <Route path="/collector" element={<CollectorPage />} />
        </Route>        
        {/* 404 */}
        <Route path="*" element={<Stub title="Not Found" />} />
      </Route>
    </Routes>
  );
}
