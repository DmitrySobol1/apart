import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ErrorMessage({ message, onRetry }) {
    return (_jsxs("div", { className: "flex items-center gap-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2", children: [_jsx("span", { className: "flex-1", children: message }), onRetry && (_jsx("button", { type: "button", onClick: onRetry, className: "shrink-0 font-medium underline hover:no-underline", children: "Retry" }))] }));
}
