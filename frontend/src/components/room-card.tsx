import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Room, Amenity } from '../types';
import { useBooking } from '../context/BookingContext';
import PhotoGallery from './photo-gallery';
import AmenityList from './amenity-list';
import PlanSelector from './plan-selector';

interface RoomCardProps {
  room: Room;
  amenityDefs: Record<string, Amenity>;
}

function getFirstPlanId(room: Room): string {
  return Object.keys(room.plans)[0] ?? '';
}

export default function RoomCard({ room, amenityDefs }: RoomCardProps) {
  const navigate = useNavigate();
  const { selectRoom, selectPlan } = useBooking();
  const [selectedPlanId, setSelectedPlanId] = useState(() => getFirstPlanId(room));

  const plan = room.plans[selectedPlanId];

  function handleBook() {
    if (!plan) return;
    selectRoom(room);
    selectPlan(plan);
    navigate('/booking');
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex gap-5 p-4">
      <PhotoGallery photos={room.photos} />

      <div className="flex flex-col flex-1 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{room.name_ru}</h2>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span>Макс. гостей: {room.adults}</span>
            <span>Доступно: {room.available}</span>
          </div>
        </div>

        <AmenityList amenityIds={room.amenities} definitions={amenityDefs} />

        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <PlanSelector
              plans={room.plans}
              selectedPlanId={selectedPlanId}
              onChange={setSelectedPlanId}
            />
            {plan && (
              <div className="text-xl font-bold text-gray-900">
                {plan.price.toLocaleString('ru-RU')} ₽
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleBook}
            disabled={!plan}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
}
