interface DatePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  disabled?: boolean;
}

function toDateInputValue(isoDate: string): string {
  return isoDate;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function DatePicker({ checkIn, checkOut, onChange, disabled }: DatePickerProps) {
  const today = new Date().toISOString().slice(0, 10);

  function handleCheckIn(value: string) {
    const newCheckOut = value >= checkOut ? addDays(value, 1) : checkOut;
    onChange(value, newCheckOut);
  }

  function handleCheckOut(value: string) {
    if (value <= checkIn) return;
    onChange(checkIn, value);
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Заезд</label>
        <input
          type="date"
          value={toDateInputValue(checkIn)}
          min={today}
          disabled={disabled}
          onChange={(e) => handleCheckIn(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Выезд</label>
        <input
          type="date"
          value={toDateInputValue(checkOut)}
          min={addDays(checkIn, 1)}
          disabled={disabled}
          onChange={(e) => handleCheckOut(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
