// src/pages/Contacts/Contacts.jsx
import React from "react";

export default function Contacts() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-neutral-800">
      <h1 className="text-3xl font-semibold mb-8 text-center">Контакты</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center text-gray-500 text-sm">
          <span>карта</span>
        </div>

        <div className="space-y-4 leading-relaxed">
          <p className="text-lg font-medium">🍕 Pizzeria</p>

          <p>
            <strong>Адрес:</strong>
            <br />
            г. Нижний Новгород, Пиццерийный пр., 123
            <br />
            ул. Вкусная, 5
          </p>

          <p>
            <strong>Часы работы:</strong>
            <br />
            Вс–Чт: 10:00 — 22:00
            <br />
            Пт–Сб: 10:00 — 00:00
          </p>

          <p>
            <strong>Телефон для заказов:</strong>
            <br />
            +7 (000) 000-00-00
          </p>

          <p>
            <strong>По вопросам сотрудничества:</strong>
            <br />
            contact@example.invalid
          </p>

          <p>
            <strong>По вопросам возврата:</strong>
            <br />
            contact@example.invalid
          </p>

          <p>
            <strong>Контроль качества:</strong>
            <br />
            +7 (000) 000-00-00
            <br />
            contact@example.invalid
          </p>

          <p>
            <strong>Мы в соцсетях:</strong>
            <br />
            VK • Telegram • Instagram
          </p>
        </div>
      </div>
    </div>
  );
}
