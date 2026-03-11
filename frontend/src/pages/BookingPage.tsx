import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import client from '../api/client';
import type { GuestData, BookingResponse } from '../types';
import GuestForm from '../components/guest-form';
import BookingSummary from '../components/booking-summary';

export default function BookingPage() {
  const { selectedRoom, selectedPlan, searchParams, setGuest } = useBooking();
  const navigate = useNavigate();

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
    if (!canSubmit || !guestData) return;
    setLoading(true);
    setError(null);
    try {
      await client.post<BookingResponse>('/booking', {
        dfrom: searchParams.dfrom,
        dto: searchParams.dto,
        planId: selectedPlan.id,
        adults: searchParams.adults,
        roomTypeId: selectedRoom.id,
        guest: guestData,
      });
      setGuest(guestData);
      navigate('/confirmation');
    } catch {
      setError('Booking request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`mt-6 w-full py-3 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Отправка...' : 'Забронировать'}
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
