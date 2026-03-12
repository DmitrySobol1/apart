import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

function formatDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("-");
  return `${d}.${m}.${y}`;
}

export default function ConfirmationPage() {
  const { selectedRoom, searchParams, guest, reset } = useBooking();
  const navigate = useNavigate();

  const handleBackToSearch = () => {
    reset();
    navigate("/");
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center p-6 py-12">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Заявка принята!</h1>
        <p className="text-sm text-gray-600 mb-6">
          Спасибо за вашу заявку. Мы свяжемся с вами в ближайшее время.
        </p>

        {selectedRoom && searchParams && (
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6 flex flex-col gap-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Номер</span>
              <span className="font-medium">{selectedRoom.name_ru}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Заезд</span>
              <span className="font-medium">{formatDate(searchParams.dfrom)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Выезд</span>
              <span className="font-medium">{formatDate(searchParams.dto)}</span>
            </div>
            {guest && (
              <div className="flex justify-between">
                <span className="text-gray-500">Гость</span>
                <span className="font-medium">
                  {guest.name} {guest.surname}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleBackToSearch}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer"
        >
          Вернуться к поиску
        </button>
      </div>
    </div>
  );
}
