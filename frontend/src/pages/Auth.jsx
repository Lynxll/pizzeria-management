// src/pages/Auth.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth-store";

export default function AuthPage() {
  const location = useLocation();
  const initialTab = location.state?.tab === "register" ? "register" : "login";
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "", address: "" });

  const auth = useAuth();
  const nav = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      if (tab === "login") {
        await auth.login(form.email, form.password);
      } else {
        await auth.register({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone || null,
          address: form.address || null,
        });
      }
      nav("/profile");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="flex gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded ${tab === "login" ? "bg-black text-white" : "border"}`}
          onClick={() => setTab("login")}
        >
          Войти
        </button>
        <button
          className={`px-3 py-1 rounded ${tab === "register" ? "bg-black text-white" : "border"}`}
          onClick={() => setTab("register")}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {tab === "register" && (
          <>
            <input className="w-full border p-2 rounded" placeholder="Имя" name="name" value={form.name} onChange={onChange} />
            <input className="w-full border p-2 rounded" placeholder="Телефон" name="phone" value={form.phone} onChange={onChange} />
            <input className="w-full border p-2 rounded" placeholder="Адрес" name="address" value={form.address} onChange={onChange} />
          </>
        )}
        <input className="w-full border p-2 rounded" placeholder="Email" type="email" name="email" value={form.email} onChange={onChange} required />
        <input className="w-full border p-2 rounded" placeholder="Пароль" type="password" name="password" value={form.password} onChange={onChange} required />
        <button className="w-full bg-black text-white rounded py-2">{tab === "login" ? "Войти" : "Зарегистрироваться"}</button>
      </form>
    </div>
  );
}
