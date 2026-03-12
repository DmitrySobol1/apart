import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MIN = 1;
const MAX = 10;
export default function GuestCounter({ value, onChange, disabled }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Guests" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => onChange(Math.max(MIN, value - 1)), disabled: disabled || value <= MIN, className: "w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed", children: "\u2212" }), _jsx("span", { className: "w-6 text-center font-medium text-gray-900", children: value }), _jsx("button", { type: "button", onClick: () => onChange(Math.min(MAX, value + 1)), disabled: disabled || value >= MAX, className: "w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-lg font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed", children: "+" })] })] }));
}
