import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
function formatAmount(amount) {
    return amount.toLocaleString("ru-RU").replace(/,/g, " ");
}
export default function ConfirmationPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = (location.state ?? {});
    const { paymentUrl, bookingNumber, amount } = state;
    useEffect(() => {
        if (!paymentUrl) {
            navigate("/", { replace: true });
            return;
        }
        const timer = setTimeout(() => {
            try {
                window.top.location.href = paymentUrl;
            }
            catch {
                window.location.href = paymentUrl;
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [paymentUrl, navigate]);
    if (!paymentUrl) {
        return null;
    }
    return (_jsx("div", { className: "bg-gray-50 flex items-center justify-center p-6 py-12", children: _jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md w-full text-center", children: [_jsx("div", { className: "flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4", children: _jsxs("svg", { className: "w-8 h-8 text-blue-600 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })] }) }), bookingNumber && (_jsxs("p", { className: "text-base font-medium text-gray-900 mb-1", children: ["\u0411\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 #", bookingNumber] })), amount !== undefined && (_jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["\u0421\u0443\u043C\u043C\u0430: ", formatAmount(amount), " \u0440\u0443\u0431."] })), _jsx("h1", { className: "text-lg font-semibold text-gray-900 mb-6", children: "\u041F\u0435\u0440\u0435\u043D\u0430\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C \u043D\u0430 \u043E\u043F\u043B\u0430\u0442\u0443..." }), _jsx("p", { className: "text-sm text-gray-500 mb-2", children: "\u0415\u0441\u043B\u0438 \u043F\u0435\u0440\u0435\u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0435 \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438:" }), _jsx("a", { href: paymentUrl, target: "_top", className: "text-blue-600 hover:underline text-sm font-medium", children: "\u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043A \u043E\u043F\u043B\u0430\u0442\u0435 \u2192" })] }) }));
}
