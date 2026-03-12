import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function toDateInputValue(isoDate) {
    return isoDate;
}
function addDays(isoDate, days) {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}
export default function DatePicker({ checkIn, checkOut, onChange, disabled }) {
    const today = new Date().toISOString().slice(0, 10);
    function handleCheckIn(value) {
        const newCheckOut = value >= checkOut ? addDays(value, 1) : checkOut;
        onChange(value, newCheckOut);
    }
    function handleCheckOut(value) {
        if (value <= checkIn)
            return;
        onChange(checkIn, value);
    }
    return (_jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Check-in" }), _jsx("input", { type: "date", value: toDateInputValue(checkIn), min: today, disabled: disabled, onChange: (e) => handleCheckIn(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Check-out" }), _jsx("input", { type: "date", value: toDateInputValue(checkOut), min: addDays(checkIn, 1), disabled: disabled, onChange: (e) => handleCheckOut(e.target.value), className: "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" })] })] }));
}
