import { create } from "zustand";
import { http } from "@/api/http";

export const useAuth = create((set, get) => ({
  token: localStorage.getItem("token") || "",
  user: null,

  isAuth: () => !!get().token,

  isAdmin: () => !!get().user?.isAdmin,
  isCourier: () => !!get().user?.isCourier,
  isCook: () => !!get().user?.isCook,
  loadMe: async () => {
    if (!get().token) return;
    try {
      const me = await http.get("/api/Auth/me", { auth: true });

      set({ user: me });
    } catch {
      localStorage.removeItem("token");
      set({ token: "", user: null });
    }
  },

  login: async (email, password) => {
    const { token } = await http.post("/api/Auth/login", { email, password });
    localStorage.setItem("token", token);
    set({ token });
    await get().loadMe();
  },

  register: async (payload) => {
    const { token } = await http.post("/api/Auth/register", payload);
    localStorage.setItem("token", token);
    set({ token });
    await get().loadMe();
  },

  logout: () => {
    // Бэкенд очистит refresh cookie; локально чистим access token в любом случае.
    http.post("/api/Auth/logout", null, { auth: true }).catch(() => {});
    localStorage.removeItem("token");
    set({ token: "", user: null });
  },
}));
