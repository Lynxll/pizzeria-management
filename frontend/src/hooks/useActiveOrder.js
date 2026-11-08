import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "@/api/client";
import { useAuth } from "@/store/auth-store";
import { isActiveOrderStatus, pickActiveOrder } from "@/lib/orderStatus";

export function useActiveOrder() {
  const isAuthenticated = useAuth((s) => s.isAuth());

  const query = useQuery({
    queryKey: ["orders", "me"],
    queryFn: getMyOrders,
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: (q) => {
      const orders = q.state.data;
      if (!Array.isArray(orders)) return false;
      return orders.some((o) => isActiveOrderStatus(o.status)) ? 15_000 : false;
    },
  });

  const activeOrder = useMemo(
    () => pickActiveOrder(query.data ?? []),
    [query.data]
  );

  return {
    activeOrder,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  };
}
