import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useBooking } from '../context/BookingContext';
import type { Room } from '../types';
import DatePicker from '../components/date-picker';
import GuestCounter from '../components/guest-counter';
import LoadingSpinner from '../components/loading-spinner';
import ErrorMessage from '../components/error-message';

function toApiDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}-${m}-${y}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { setSearchParams, setRooms } = useBooking();

  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(tomorrowIso());
  const [guests, setGuests] = useState(2);
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.get<{ name: string }>('/account').then((res) => {
      setHotelName(res.data.name);
    }).catch(() => {});
  }, []);

  function handleDatesChange(newCheckIn: string, newCheckOut: string) {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
  }

  async function handleSearch() {
    setLoading(true);
    setError(null);

    try {
      const dfrom = toApiDate(checkIn);
      const dto = toApiDate(checkOut);
      const res = await client.get<Room[]>('/rooms', { params: { dfrom, dto } });
      setSearchParams({ dfrom, dto, adults: guests });
      setRooms(res.data);
      navigate('/rooms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8">
        {hotelName && (
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">{hotelName}</h1>
        )}

        <div className="space-y-5">
          <DatePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={handleDatesChange}
            disabled={loading}
          />

          <GuestCounter value={guests} onChange={setGuests} disabled={loading} />

          {error && <ErrorMessage message={error} onRetry={handleSearch} />}

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
