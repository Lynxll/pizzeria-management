const RAW = import.meta.env.VITE_API_URL || "https://localhost:7020";
const normalize = s => (s || "").replace(/\/+$/, "");
const baseNoApi = normalize(RAW).replace(/\/api$/i, "");
const stripApiPrefix = p => ("/" + String(p || "").replace(/^\/+/, "")).replace(/^\/api(\/|$)/i, "/");
export const apiV1 = (path = "") => `${baseNoApi}/api${stripApiPrefix(path)}`;

const getToken = () => localStorage.getItem("token") || "";
const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(apiV1("/Auth/refresh"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json().catch(() => null);
      const token = data?.token || "";
      if (!token) throw new Error("Refresh token response has no access token");
      setToken(token);
      return token;
    })();
  }
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function fetchJson(url, { method = "GET", body, auth = false, headers } = {}) {
  const h = { "Content-Type": "application/json", ...(headers || {}) };
  if (auth) h.Authorization = `Bearer ${getToken()}`;

  const doFetch = (hdrs) =>
    fetch(url, {
      method,
      headers: hdrs,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(h);

  const lowerUrl = String(url || "").toLowerCase();
  const isAuthFlowCall =
    lowerUrl.includes("/auth/login") ||
    lowerUrl.includes("/auth/register") ||
    lowerUrl.includes("/auth/refresh") ||
    lowerUrl.includes("/auth/logout");

  if (res.status === 401 && auth && !isAuthFlowCall) {
    try {
      const newToken = await refreshAccessToken();
      const retryHeaders = { ...h, Authorization: `Bearer ${newToken}` };
      res = await doFetch(retryHeaders);
    } catch {
      setToken("");
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} at ${res.url}. First 120: ${text.slice(0,120)}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

export const getMenus  = () => fetchJson(apiV1("/menus"));
export const getPizzas = () => fetchJson(apiV1("/pizzas"));

export const getOrdersByCustomer = (customerId) => {
  const qs =
    customerId != null
      ? `?customerId=${encodeURIComponent(customerId)}`
      : "";

  return fetchJson(apiV1(`/orders${qs}`), { auth: true })
    .then((r) => r?.items ?? r);
};

export const getOrderById  = id => fetchJson(apiV1(`/orders/${id}`),       { auth: true });
export const getOrderItems = id => fetchJson(apiV1(`/orders/${id}/items`), { auth: true });

export const createOrder = ({
  delivery_address,
  discount_id = null,
  delivery_lat = null,
  delivery_lng = null,
  location_confirmed = false,

  contact_name,
  contact_phone,
  contact_email,
  comment,
  change_from,
  pay_cash,
  need_call_courier,
}) =>
  fetchJson(apiV1("/orders"), {
    method: "POST",
    auth: true,
    body: {
      delivery_address,
      discount_id,

      // 🔽 И ОТПРАВЛЯЕМ
      delivery_lat,
      delivery_lng,
      location_confirmed,

      contact_name,
      contact_phone,
      contact_email,
      comment,
      change_from,
      pay_cash,
      need_call_courier,
    },
  });




export const addOrderItem = (orderId, { pizza_id, quantity }) =>
  fetchJson(apiV1(`/orders/${orderId}/items`), {
    method: "POST",
    body: { pizza_id, quantity },
    auth: true,
  });

// Auth 
export const authRegister = (payload) => fetchJson(apiV1("Auth/register"), { method: "POST", body: payload });
export const authLogin    = (email, password) => fetchJson(apiV1("Auth/login"), { method: "POST", body: { email, password } });
export const authMe       = () => fetchJson(apiV1("/Auth/me"), { auth: true });

export const getMyOrders = async () => {
  const me = await authMe();
  return fetchJson(apiV1(`/orders?customerId=${encodeURIComponent(me.id)}`), { auth: true })
    .then(r => r?.items ?? r);
};
// Reviews API 
export const getReviews = (orderId) =>
  fetchJson(
    apiV1(orderId ? `/reviews?orderId=${encodeURIComponent(orderId)}` : "/reviews")
  );
export const getReviewById = (id) =>
  fetchJson(apiV1(`/reviews/${id}`));

export const getReviewForOrder = async (orderId) => {
  const arr = await getReviews(orderId);
  return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
};

export const createReview = ({ order_id, rating, comment }) =>
  fetchJson(apiV1(`/reviews`), {
    method: "POST",
    body: { order_id, rating, comment },
  });

export const updateReview = (id, { rating, comment }) =>
  fetchJson(apiV1(`/reviews/${id}`), {
    method: "PUT",
    body: { rating, comment },
  });

export const deleteReview = (id) =>
  fetchJson(apiV1(`/reviews/${id}`), { method: "DELETE" });

export const getAdminDashboard = () =>
  fetchJson(apiV1("/admin/dashboard"), { auth: true });

export const adminGetMenu = () =>
  fetchJson(apiV1("/admin/menu"), { auth: true });

export const adminCreateMenuItem = (payload) =>
  fetchJson(apiV1("/admin/menu"), {
    method: "POST",
    auth: true,
    body: payload,
  });

export const adminUpdateMenuItem = (id, payload) =>
  fetchJson(apiV1(`/admin/menu/${id}`), {
    method: "PUT",
    auth: true,
    body: payload,
  });

export const adminGetReviews = (onlyPending = true) =>
  fetchJson(apiV1(`/admin/reviews?onlyPending=${onlyPending}`), { auth: true });

export const adminApproveReview = (id) =>
  fetchJson(apiV1(`/admin/reviews/${id}/approve`), {
    method: "PUT",
    auth: true,
  });

export const adminDeleteReviewAdmin = (id) =>
  fetchJson(apiV1(`/admin/reviews/${id}`), {
    method: "DELETE",
    auth: true,
  });
export const adminGetOrders = ({ page = 1, pageSize = 50 } = {}) =>
  fetchJson(apiV1(`/orders?page=${page}&pageSize=${pageSize}`), {
    auth: true, 
  });
// Courier API
export const courierGetState = () =>
  fetchJson(apiV1("/courier/state"), { auth: true });

export const courierStartShift = () =>
  fetchJson(apiV1("/courier/shift/start"), {
    method: "POST",
    auth: true,
  });

export const courierStopShift = () =>
  fetchJson(apiV1("/courier/shift/stop"), {
    method: "POST",
    auth: true,
  });

export const courierStartBreak = () =>
  fetchJson(apiV1("/courier/break/start"), {
    method: "POST",
    auth: true,
  });

export const courierStopBreak = () =>
  fetchJson(apiV1("/courier/break/stop"), {
    method: "POST",
    auth: true,
  });

export const courierGetActiveOrders = () =>
  fetchJson(apiV1("/courier/orders/active"), { auth: true });

export const courierTakeOrder = (deliveryId) =>
  fetchJson(apiV1(`/courier/orders/${deliveryId}/take`), {
    method: "POST",
    auth: true,
  });

export const courierCompleteOrder = (deliveryId) =>
  fetchJson(apiV1(`/courier/orders/${deliveryId}/complete`), {
    method: "POST",
    auth: true,
  });

export const courierTripDepart = () =>
  fetchJson(apiV1("/courier/trip/depart"), {
    method: "POST",
    auth: true,
  });

export const courierTripReturn = () =>
  fetchJson(apiV1("/courier/trip/return"), {
    method: "POST",
    auth: true,
  });

//Admin deliveries API 

export const adminGetDeliveriesQueue = () =>
  fetchJson(apiV1("/admin/deliveries/ready-queue"), { auth: true });

export const adminUpdateDeliveryQueuePosition = (deliveryId, queue_position) =>
  fetchJson(
    apiV1(
      `/admin/deliveries/${deliveryId}/queue-position?position=${encodeURIComponent(
        queue_position
      )}`
    ),
    {
      method: "PATCH",
      auth: true,
    }
  );


export const adminReassignCourier = (deliveryId, courier_id) =>
  fetchJson(
    apiV1(
      `/admin/deliveries/${deliveryId}/reassign-courier?courierId=${encodeURIComponent(
        courier_id
      )}`
    ),
    {
      method: "PATCH",
      auth: true,
    }
  );

export const adminGetCouriers = () =>
  fetchJson(apiV1("/employees?role=Courier"), { auth: true });

export const cookGetDashboard = () =>
  fetchJson(apiV1("/kitchen/dashboard"), { auth: true });

export const cookMarkCooked = (orderItemId) =>
  fetchJson(apiV1(`/kitchen/items/${orderItemId}/mark-cooked`), {
    method: "POST",
    auth: true,
  });

// Collector API

export const collectorGetDashboard = () =>
  fetchJson(apiV1("/collector/dashboard"), { auth: true });

export const collectorMarkReceived = (orderItemId) =>
  fetchJson(apiV1(`/collector/items/${orderItemId}/mark-received`), {
    method: "POST",
    auth: true,
  });

export const collectorMarkPacked = (orderId) =>
  fetchJson(apiV1(`/collector/orders/${orderId}/mark-packed`), {
    method: "POST",
    auth: true,
  });

export const collectorResolveCancelled = (orderItemId) =>
  fetchJson(apiV1(`/collector/cancelled-items/${orderItemId}/resolve`), {
    method: "POST",
    auth: true,
  });

export const courierMapOrders = () =>
  fetchJson(apiV1("/courier/map"), {
    method: "GET",
    auth: true,
  });