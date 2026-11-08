// src/lib/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth-store";

export default function ProtectedRoute() {
  const { isAuth, user, loadMe } = useAuth();
  const [ready, setReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (isAuth() && !user) await loadMe();
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!isAuth()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!ready) {
    return (
      <div className="p-6 text-center text-sm text-neutral-500">
        Загрузка...
      </div>
    );
  }

  return <Outlet />;
}
