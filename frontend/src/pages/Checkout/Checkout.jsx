// pages/Checkout/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder, addOrderItem } from "@/api/client";
import { useCart } from "@/store/cart-store";
import MapPicker from "@/components/MapPicker";
import WarmPaperBackground from "@/components/WarmPaperBackground";

const CITY_FALLBACKS = {
  "нижний новгород": { lat: 56.2965, lng: 43.9361 },
  "санкт-петербург": { lat: 59.9343, lng: 30.3351 },
  "москва": { lat: 55.7558, lng: 37.6173 },
};

export default function CheckoutPage() {
  const nav = useNavigate();
  const { items, clear } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    street: "",
    house: "",
    entrance: "",
    intercom: "",
    apartment: "",
    floor: "",
    comment: "",
    promo: "",
    payCash: false,
    payOnline: false,
    needCall: false,
    email: "",
    changeFrom: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Геокодинг / карта ---
  const [geoStatus, setGeoStatus] = useState(null); // "Ok" | "CityOnly" | "NotFound"
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [showMap, setShowMap] = useState(false);

  const total = useMemo(
    () => items.reduce((s, it) => s + it.price * it.qty, 0),
    [items]
  );

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // ✅ ВАЖНО: если меняют адрес — сбрасываем старые координаты
  useEffect(() => {
    setCoords(null);
    setGeoStatus(null);
    // карту не обязательно закрывать, но координаты должны обновляться заново
  }, [form.city, form.street, form.house]);

  const validate = () => {
    const req = [
      "name",
      "phone",
      "city",
      "street",
      "house",
      "entrance",
      "intercom",
      "apartment",
      "floor",
    ];
    for (const k of req) {
      if (!String(form[k]).trim()) {
        setError("Заполните все обязательные поля.");
        return false;
      }
    }
    if (!items.length) {
      setError("Корзина пуста.");
      return false;
    }
    return true;
  };

  // Полный адрес (для курьера/хранения)
  const deliveryAddress = useMemo(() => {
    const parts = [
      form.city && `г. ${form.city}`,
      form.street && `ул. ${form.street}`,
      form.house && `д. ${form.house}`,
      form.apartment && `кв. ${form.apartment}`,
      form.entrance && `подъезд ${form.entrance}`,
      form.floor && `этаж ${form.floor}`,
      form.intercom && `домофон ${form.intercom}`,
      form.comment && `комментарий: ${form.comment}`,
    ].filter(Boolean);

    return parts.join(", ");
  }, [form]);

  // Запрос для геокодинга (только то, что “на карте”)
  const geocodeQuery = useMemo(() => {
    const city = form.city?.trim();
    const street = form.street?.trim();
    const house = form.house?.trim();
    return city && street && house ? `${street} ${house}, ${city}, Россия` : "";
  }, [form.city, form.street, form.house]);

  // Фолбэк на город
  const cityQuery = useMemo(() => {
    return form.city ? `${form.city}, Россия` : "";
  }, [form.city]);

  const geocodeAddress = async () => {
    // 1) пробуем полный адрес (город+улица+дом)
    if (geocodeQuery) {
      const r = await fetch(
        `/api/geocode?query=${encodeURIComponent(geocodeQuery)}`
      );

      if (r.ok && r.headers.get("content-type")?.includes("application/json")) {
        const d = await r.json();

        if (d.results?.length) {
          setGeoStatus("Ok");
          setCoords({ lat: +d.results[0].lat, lng: +d.results[0].lon });
          return "Ok";
        }
      }
    }

    // 2) если адрес не найден — пробуем город
    if (cityQuery) {
      const r = await fetch(
        `/api/geocode?query=${encodeURIComponent(cityQuery)}`
      );

      if (r.ok && r.headers.get("content-type")?.includes("application/json")) {
        const d = await r.json();

        if (d.results?.length) {
          setGeoStatus("CityOnly");
          setCoords({ lat: +d.results[0].lat, lng: +d.results[0].lon });
          return "CityOnly";
        }
      }
    }

    // 3) совсем не нашли
    setGeoStatus("NotFound");
    setCoords(null);
    return "NotFound";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    try {
      setSubmitting(true);

      // если точку не выбрали — попробуем геокодинг
      if (!coords) {
        try {
          const status = await geocodeAddress();

          if (status === "NotFound") {
            setShowMap(true);
            setError("Адрес не найден. Уточните точку доставки на карте.");
            return;
          }

          if (status === "CityOnly") {
            setShowMap(true);
            setError("Адрес найден неточно (только город). Уточните точку на карте.");
            return;
          }
        } catch {
          setShowMap(true);
          setError("Сервис проверки адреса недоступен. Выберите точку на карте.");
          return;
        }
      }

      if (!coords) {
        setShowMap(true);
        setError("Выберите точку доставки на карте.");
        return;
      }

      const created = await createOrder({
        delivery_address: deliveryAddress,
        discount_id: null,

        delivery_lat: coords.lat,
        delivery_lng: coords.lng,
        // в твоей логике можно оставить true (MVP), но это “честнее” при клике.
        location_confirmed: true,

        contact_name: form.name,
        contact_phone: form.phone,
        contact_email: form.email || null,
        comment: form.comment || null,
        change_from: form.changeFrom ? Number(form.changeFrom) : null,

        pay_cash: form.payCash,
        need_call_courier: form.needCall,
      });

      const orderId = created?.id ?? created?.order?.id ?? created?.order_id;

      await Promise.all(
        items.map((it) =>
          addOrderItem(orderId, { pizza_id: it.id, quantity: it.qty })
        )
      );

      clear();
      nav(`/orders/${orderId}`);
    } catch (err) {
      setError(
        err?.message || "Не удалось оформить заказ. Попробуйте ещё раз позже."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Центр карты: coords -> город fallback -> дефолт
  const mapCenter =
    coords ??
    CITY_FALLBACKS[(form.city || "").trim().toLowerCase()] ??
    { lat: 59.9343, lng: 30.3351 };

  return (
    <WarmPaperBackground>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-4">
          <Link to="/cart" className="text-[#4F46E5] hover:underline">
            ← Вернуться в корзину
          </Link>
        </div>

        <h1 className="mb-6 text-2xl font-semibold text-[#1C1917]">Оформление заказа</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="rounded-xl border border-[#E9D5FF] bg-white/70 p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
            <h2 className="mb-4 text-lg font-semibold text-[#1C1917]">Контакты</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Контактный телефон"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+7 900 000-00-00"
                required
              />
              <LabeledInput
                label="Ваше имя"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Иван"
                required
              />
            </div>
            <div className="mt-4">
              <LabeledInput
                label="Адрес электронной почты"
                name="email"
                value={form.email || ""}
                onChange={onChange}
                placeholder="name@example.com"
                type="email"
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#E9D5FF] bg-white/70 p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
            <h2 className="mb-4 text-lg font-semibold text-[#1C1917]">Адрес доставки</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="Город"
                name="city"
                value={form.city}
                onChange={onChange}
                placeholder="Санкт-Петербург"
                required
              />
              <LabeledInput
                label="Улица"
                name="street"
                value={form.street}
                onChange={onChange}
                placeholder="Невский проспект"
                required
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <LabeledInput
                label="Дом"
                name="house"
                value={form.house}
                onChange={onChange}
                required
              />
              <LabeledInput
                label="Квартира"
                name="apartment"
                value={form.apartment}
                onChange={onChange}
                required
              />
              <LabeledInput
                label="Этаж"
                name="floor"
                value={form.floor}
                onChange={onChange}
                required
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput
                label="Подъезд"
                name="entrance"
                value={form.entrance}
                onChange={onChange}
                required
              />
              <LabeledInput
                label="Код домофона"
                name="intercom"
                value={form.intercom}
                onChange={onChange}
                required
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#E9D5FF] bg-white/70 p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
            <h2 className="mb-4 text-lg font-semibold text-[#1C1917]">Дополнительно</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <LabeledInput
                label="С какой суммы подготовить сдачу"
                name="changeFrom"
                value={form.changeFrom || ""}
                onChange={onChange}
                placeholder="Например: 2000"
                inputMode="numeric"
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1C1917]">Промокод</label>
                <div className="flex gap-3">
                  <input
                    className="w-full rounded-lg border border-[#E9D5FF] bg-white/80 px-3 py-2 text-[#1C1917] outline-none transition-colors focus:border-[#C4B5FD]"
                    name="promo"
                    value={form.promo}
                    onChange={onChange}
                    placeholder="Введите промокод"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-[#C77D2B] px-4 py-2 text-white transition-colors hover:bg-[#B56F22]"
                    onClick={() => alert("Промокод пока не применяем 🙂")}
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-[#E9D5FF] bg-white/65 p-3">
              <Checkbox
                name="payCash"
                checked={form.payCash}
                onChange={onChange}
                label="оплата наличными курьеру"
              />
              <Checkbox
                name="payOnline"
                checked={form.payOnline}
                onChange={onChange}
                label="оплата через сайт картами МИР/Visa/MasterCard (макет)"
              />
              <Checkbox
                name="needCall"
                checked={form.needCall}
                onChange={onChange}
                label="требуется звонок курьера"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-[#1C1917]">
                Комментарии и пожелания
              </label>
              <textarea
                className="min-h-[88px] w-full rounded-lg border border-[#E9D5FF] bg-white/80 px-3 py-2 text-[#1C1917] outline-none transition-colors focus:border-[#C4B5FD]"
                name="comment"
                value={form.comment}
                onChange={onChange}
                placeholder="Например: не звонить в домофон"
              />
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-[#C77D2B] px-4 py-2 text-white transition-colors hover:bg-[#B56F22]"
              onClick={async () => {
                try {
                  setError("");
                  setShowMap(true);
                  const status = await geocodeAddress();

                  if (status === "NotFound") {
                    setError("Адрес не найден. Можно уточнить точку кликом на карте.");
                  } else if (status === "CityOnly") {
                    setError("Адрес найден неточно (только город). Уточните точку на карте.");
                  }
                } catch {
                  setShowMap(true);
                  setGeoStatus("NotFound");
                  setError("Сервис проверки адреса недоступен. Выберите точку на карте.");
                }
              }}
            >
              Проверить адрес на карте
            </button>

            {showMap && (
              <div className="mt-4 rounded-xl border border-[#E9D5FF] bg-white/70 p-3">
                <div className="mb-2 text-sm font-medium text-[#1C1917]">
                  Карта (кликните по нужному месту, если хотите уточнить)
                </div>

                <MapPicker
                  center={mapCenter}
                  onPick={(latlng) => setCoords({ lat: latlng.lat, lng: latlng.lng })}
                />

                {coords && (
                  <div className="mt-2 text-xs text-[#9C8F80]/75">
                    Выбрано: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </div>
                )}
              </div>
            )}

            <div className="relative mt-4 overflow-hidden rounded-xl border border-[#FDE68A] bg-white p-4 shadow-[0_2px_12px_rgba(28,25,23,0.06)]">
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    "radial-gradient(120% 70% at 15% 0%, rgba(250, 204, 21, 0.10) 0%, rgba(250, 204, 21, 0.035) 38%, rgba(255, 255, 255, 0) 70%)",
                }}
                aria-hidden
              />
              <div className="relative z-10 flex items-center justify-between">
                <div className="text-sm text-[#9C8F80]/75">К оплате</div>
                <div className="text-lg font-semibold text-[#1C1917]">{total} ₽</div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2]/90 px-3 py-2 text-sm font-medium text-[#B91C1C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-lg bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] px-5 py-3 text-base font-semibold text-white shadow-[0_0_18px_rgba(245,158,11,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_22px_rgba(245,158,11,0.33)] disabled:opacity-70"
            >
              {submitting ? "Оформляем..." : "Оформить заказ"}
            </button>
          </section>
        </form>
      </div>
    </WarmPaperBackground>
  );
}

function LabeledInput(props) {
  const { label, required, ...rest } = props;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[#1C1917]">
        {label} {required ? "*" : ""}
      </label>
      <input
        className="w-full rounded-lg border border-[#E9D5FF] bg-white/80 px-3 py-2 text-[#1C1917] outline-none transition-colors focus:border-[#C4B5FD]"
        required={required}
        {...rest}
      />
    </div>
  );
}

function Checkbox({ name, checked, onChange, label }) {
  return (
    <label className="flex select-none items-center gap-2">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-[#C4B5FD]"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span className="text-sm text-[#9C8F80]/85">{label}</span>
    </label>
  );
}
