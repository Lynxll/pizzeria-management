import { useState } from "react";
import Stars from "@/components/ui/Stars";
import { createReview } from "@/api/client";

export default function ReviewModal({ open, orderId, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  if (!open) return null;

  const submit = async () => {
    try {
      setPending(true);
      await createReview({ order_id: orderId, rating, comment: text });
      onSubmitted?.();
      onClose();
    } catch (e) {
      alert(e.message ?? "Не удалось отправить отзыв");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-4 space-y-3">
        <h3 className="text-lg font-semibold">Отзыв о заказе №{orderId}</h3>

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm text-neutral-600">Оценка:</span>
          <Stars editable value={rating} onChange={setRating} size="text-2xl" />
        </div>

        <textarea
          className="w-full min-h-[100px] rounded-md border p-2"
          placeholder="Ваше мнение вжно для нас"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button className="rounded-md border px-3 py-1" onClick={onClose} disabled={pending}>
            Отмена
          </button>
          <button
            className="rounded-md bg-black px-3 py-1 text-white disabled:opacity-50"
            onClick={submit}
            disabled={pending}
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
