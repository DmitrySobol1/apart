import type { Room, RoomPlan, SearchParams } from '../types';

interface BookingSummaryProps {
  room: Room;
  plan: RoomPlan;
  searchParams: SearchParams;
}

function formatDate(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split('-');
  return `${d}.${m}.${y}`;
}

export default function BookingSummary({ room, plan, searchParams }: BookingSummaryProps) {
  const photo = room.photos.sort((a, b) => a.order - b.order)[0];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {photo && (
        <img
          src={photo.url}
          alt={room.name_ru}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-semibold text-gray-900 text-base">{room.name_ru}</h3>

        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Заезд</span>
            <span className="font-medium text-gray-800">{formatDate(searchParams.dfrom)}</span>
          </div>
          <div className="flex justify-between">
            <span>Выезд</span>
            <span className="font-medium text-gray-800">{formatDate(searchParams.dto)}</span>
          </div>
          <div className="flex justify-between">
            <span>Гостей</span>
            <span className="font-medium text-gray-800">{searchParams.adults}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-600">Тариф</p>
          <p className="text-sm font-medium text-gray-800">{plan.name_ru ?? plan.name}</p>
        </div>

        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">Итого</span>
          <span className="text-lg font-bold text-gray-900">{plan.price.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>
    </div>
  );
}
