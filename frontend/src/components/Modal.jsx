import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children, width = "max-w-xl" }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* фон */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />
      {/* карточка */}
      <div className={`relative z-10 w-full ${width} mx-4`}>
        <div className="bg-white rounded-2xl shadow-xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              className="px-2 py-1 rounded-lg hover:bg-gray-100"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
