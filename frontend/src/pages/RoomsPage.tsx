import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import client from "../api/client";
import type { Amenity, AmenityGroup, Room } from "../types";
import RoomCard from "../components/room-card";

function flattenAmenities(groups: Record<string, AmenityGroup>): Record<string, Amenity> {
  const result: Record<string, Amenity> = {};
  for (const group of Object.values(groups)) {
    for (const [id, def] of Object.entries(group.amenities)) {
      result[id] = { id, ...def };
    }
  }
  return result;
}

function getMinPrice(room: Room): number {
  const prices = Object.values(room.plans).map((p) => p.price);
  return prices.length > 0 ? Math.min(...prices) : Infinity;
}

function formatApiDate(apiDate: string): string {
  const [d, m, y] = apiDate.split("-");
  return `${d}.${m}.${y}`;
}

export default function RoomsPage() {
  const { searchParams, rooms } = useBooking();
  const [amenityDefs, setAmenityDefs] = useState<Record<string, Amenity>>({});

  useEffect(() => {
    client
      .get<{ amenities: Record<string, AmenityGroup> }>("/amenities")
      .then((res) => setAmenityDefs(flattenAmenities(res.data.amenities)))
      .catch(() => {});
  }, []);

  if (!searchParams || !rooms) return null;

  const filtered = rooms
    .filter((r) => r.available > 0 && r.adults >= searchParams.adults)
    .sort((a, b) => getMinPrice(a) - getMinPrice(b));

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Заезд: <strong>{formatApiDate(searchParams.dfrom)}</strong>
              {" · "}
              Выезд: <strong>{formatApiDate(searchParams.dto)}</strong>
              {" · "}
              Гостей: <strong>{searchParams.adults}</strong>
            </p>
          </div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← Изменить параметры
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">
              Нет доступных номеров на выбранные даты. Попробуйте другие даты.
            </p>
            <Link to="/" className="text-blue-600 hover:underline">
              ← Вернуться к поиску
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((room) => (
              <RoomCard key={room.id} room={room} amenityDefs={amenityDefs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
