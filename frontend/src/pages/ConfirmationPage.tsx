import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  paymentUrl?: string;
  bookingNumber?: string;
  amount?: number;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ru-RU").replace(/,/g, " ");
}

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as LocationState;
  const { paymentUrl, bookingNumber, amount } = state;

  useEffect(() => {
    if (!paymentUrl) {
      navigate("/", { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      try {
        window.top!.location.href = paymentUrl;
      } catch {
        window.location.href = paymentUrl;
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [paymentUrl, navigate]);

  if (!paymentUrl) {
    return null;
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center p-6 py-12">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>

        {bookingNumber && (
          <p className="text-base font-medium text-gray-900 mb-1">
            Бронирование #{bookingNumber}
          </p>
        )}
        {amount !== undefined && (
          <p className="text-sm text-gray-600 mb-4">
            Сумма: {formatAmount(amount)} руб.
          </p>
        )}

        <h1 className="text-lg font-semibold text-gray-900 mb-6">
          Перенаправляем на оплату...
        </h1>

        <p className="text-sm text-gray-500 mb-2">
          Если перенаправление не произошло автоматически:
        </p>
        <a
          href={paymentUrl}
          target="_top"
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Перейти к оплате →
        </a>
      </div>
    </div>
  );
}
