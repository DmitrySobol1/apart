import type { Amenity } from '../types';

interface AmenityListProps {
  amenityIds: Record<string, { value: string }>;
  definitions: Record<string, Amenity>;
}

export default function AmenityList({ amenityIds, definitions }: AmenityListProps) {
  const items = Object.entries(amenityIds)
    .map(([id, data]) => {
      const def = definitions[id];
      if (!def) return null;
      const label = def.type === 'int' && data.value
        ? `${def.name_ru}: ${data.value}${def.unit === 'm2' ? ' м²' : ''}`
        : def.name_ru;
      return { id, label, icon: def.icon };
    })
    .filter((item): item is { id: string; label: string; icon: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.id} className="relative group flex items-center gap-1">
          {item.icon ? (
            <img src={item.icon} alt="" className="w-4 h-4 opacity-60" />
          ) : (
            <span className="w-4 h-4 bg-gray-300 rounded-sm inline-block" />
          )}
          <span className="text-xs text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
