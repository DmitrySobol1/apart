import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import client from "../api/client";
import type { GuestData, BookingResponse } from "../types";
import GuestForm from "../components/guest-form";
import BookingSummary from "../components/booking-summary";
import LoadingSpinner from "../components/loading-spinner";
import ErrorMessage from "../components/error-message";

export default function BookingPage() {
  const { selectedRoom, selectedPlan, searchParams, setGuest } = useBooking();
  const navigate = useNavigate();
  const submittingRef = useRef(false);

  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [formValid, setFormValid] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedRoom || !selectedPlan || !searchParams) {
    return null;
  }

  const canSubmit = formValid && agreed && !loading;

  const handleFormChange = (valid: boolean, data: GuestData | null) => {
    setFormValid(valid);
    setGuestData(data);
  };

  const handleSubmit = async () => {
    if (submittingRef.current || !canSubmit || !guestData) return;
    submittingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await client.post<BookingResponse>("/booking", {
        dfrom: searchParams.dfrom,
        dto: searchParams.dto,
        planId: selectedPlan.id,
        adults: searchParams.adults,
        roomTypeId: selectedRoom.id,
        guest: guestData,
      });
      if (!response.data.success) {
        setError(response.data.message ?? "Произошла ошибка. Попробуйте ещё раз.");
        return;
      }
      setGuest(guestData);
      navigate("/confirmation", {
        state: {
          paymentUrl: response.data.paymentUrl,
          bookingNumber: response.data.bookingNumber,
          amount: response.data.amount,
        },
      });
    } catch {
      setError("Не удалось создать бронирование. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Оформление бронирования</h1>
          <Link to="/rooms" className="text-sm text-blue-600 hover:underline">
            ← Назад к номерам
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Данные гостя</h2>
            <GuestForm onValidChange={handleFormChange} disabled={loading} />

            <div className="mt-6 flex items-start gap-2">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={loading}
                className="mt-0.5 cursor-pointer"
              />
              <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                Я согласен с условиями обработки персональных данных
              </label>
            </div>

            {error && (
              <div className="mt-4">
                <ErrorMessage message={error} />
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors cursor-pointer"
                >
                  Повторить
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`mt-6 w-full py-3 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Отправка...
                </>
              ) : (
                "Забронировать"
              )}
            </button>
          </div>

          <div className="col-span-1">
            <BookingSummary room={selectedRoom} plan={selectedPlan} searchParams={searchParams} />
          </div>
        </div>
      </div>
    </div>
  );
}
