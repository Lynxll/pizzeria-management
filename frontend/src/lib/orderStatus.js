export const STATUS_MAP = {
  0: "принят",
  1: "готовится",
  2: "в пути",
  3: "доставлен",
  4: "отменен",
  Accepted: "принят",
  Assigned: "назначен",
  InProgress: "в пути",
  Delivered: "доставлен",
  Cancelled: "отменен",
  Ready: "готов",
};

export const ACTIVE_STATUS_SET = new Set([
  "принят",
  "готовится",
  "назначен",
  "готов",
  "в пути",
]);

export const STATUS_LABELS = {
  принят: "Принят",
  готовится: "Готовится",
  назначен: "Курьер назначен",
  готов: "Готов",
  "в пути": "В доставке",
  доставлен: "Доставлен",
  отменен: "Отменён",
};

export const STATUS_BANNER_STYLES = {
  принят: "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]",
  готовится: "bg-[#FEF9C3] text-[#854D0E] border-[#FDE68A]",
  назначен: "bg-[#E0E7FF] text-[#3730A3] border-[#C7D2FE]",
  готов: "bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]",
  "в пути": "bg-[#E0F2FE] text-[#1D4ED8] border-[#BAE6FD]",
};

const BANNER_COPY = {
  принят: { title: "Заказ принят", hint: "Скоро начнём готовить" },
  готовится: { title: "Готовим ваш заказ", hint: "Пицца уже на кухне" },
  назначен: { title: "Курьер назначен", hint: "Скоро заберёт заказ" },
  готов: { title: "Заказ готов", hint: "Передаём курьеру" },
  "в пути": { title: "В доставке", hint: "Курьер уже в пути" },
};

export function normalizeOrderStatus(status) {
  if (status == null || status === "") return null;
  if (typeof status === "number") {
    return STATUS_MAP[status] ?? String(status);
  }
  const mapped = STATUS_MAP[status];
  if (mapped) return mapped;
  return String(status).toLowerCase();
}

export function isActiveOrderStatus(status) {
  const normalized = normalizeOrderStatus(status);
  if (!normalized) return false;
  return ACTIVE_STATUS_SET.has(normalized);
}

export function getOrderBannerCopy(status) {
  const normalized = normalizeOrderStatus(status);
  return BANNER_COPY[normalized] ?? { title: "Ваш заказ", hint: STATUS_LABELS[normalized] ?? normalized };
}

export function pickActiveOrder(orders) {
  if (!Array.isArray(orders) || orders.length === 0) return null;

  const active = orders.filter((o) => isActiveOrderStatus(o.status));
  if (active.length === 0) return null;

  return [...active].sort((a, b) => {
    const ta = new Date(a.order_date || a.created_at || 0).getTime();
    const tb = new Date(b.order_date || b.created_at || 0).getTime();
    return tb - ta;
  })[0];
}
