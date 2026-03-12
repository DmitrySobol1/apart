import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
};
export default function LoadingSpinner({ size = "md" }) {
    return (_jsx("div", { className: "flex items-center justify-center", children: _jsxs("svg", { className: `animate-spin ${sizeMap[size]} text-blue-600`, viewBox: "0 0 24 24", fill: "none", "aria-label": "Loading", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })] }) }));
}
