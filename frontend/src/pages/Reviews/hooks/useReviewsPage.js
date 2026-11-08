import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders, getReviews } from "@/api/client";

export default function useReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigatingToReview, setIsNavigatingToReview] = useState(false);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch((e) => alert(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  async function goToLastOrderReview() {
    setIsNavigatingToReview(true);
    try {
      const orders = await getMyOrders();
      if (!Array.isArray(orders) || orders.length === 0) {
        alert("У вас пока нет заказов для отзыва.");
        return;
      }

      const latestOrder = [...orders].sort((a, b) => {
        const aTs = new Date(a?.order_date || a?.created_at || 0).getTime();
        const bTs = new Date(b?.order_date || b?.created_at || 0).getTime();
        if (aTs !== bTs) return bTs - aTs;
        return Number(b?.id || 0) - Number(a?.id || 0);
      })[0];

      if (!latestOrder?.id) {
        alert("Не удалось определить последний заказ.");
        return;
      }

      navigate(`/orders/${latestOrder.id}?openReview=1`);
    } catch (e) {
      alert(e?.message || "Не удалось открыть последний заказ.");
    } finally {
      setIsNavigatingToReview(false);
    }
  }

  return {
    reviews,
    isLoading,
    isNavigatingToReview,
    goToLastOrderReview,
  };
}
