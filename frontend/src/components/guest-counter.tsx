const MIN = 1;
const MAX = 10;

interface GuestCounterProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function GuestCounter({ value, onChange, disabled }: GuestCounterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(MIN, value - 1))}
          disabled={disabled || value <= MIN}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-6 text-center font-medium text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(MAX, value + 1))}
          disabled={disabled || value >= MAX}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
