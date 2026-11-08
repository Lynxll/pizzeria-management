// src/api/http.js
import { apiV1 } from "./client";

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

async function request(method, path, { body, auth = false, headers = {} } = {}) {
  const url = apiV1(path);

  const h = { ...(headers || {}) };

  let payload = body;
  if (body != null && !(body instanceof FormData) && !h["Content-Type"]) {
    h["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) h.Authorization = `Bearer ${getToken()}`;

  const doFetch = (hdrs) =>
    fetch(url, {
      method,
      headers: hdrs,
      credentials: "include",
      body: payload,
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
    throw new Error(
      `HTTP ${res.status} ${res.statusText} at ${res.url}. First 120: ${text.slice(0, 120)}`
    );
  }

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

const http = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...(opts || {}), body }),
  put: (path, body, opts) => request("PUT", path, { ...(opts || {}), body }),
  patch: (path, body, opts) => request("PATCH", path, { ...(opts || {}), body }),
  delete: (path, opts) => request("DELETE", path, opts),
};

export default http;
export { http }; 
export const auth = {
  register: (payload) => http.post("Auth/register", payload),
  login: (email, password) => http.post("Auth/login", { email, password }),
  me: () => http.get("Auth/me", { auth: true }),
  logout: () => http.post("Auth/logout", null, { auth: true }),
};
