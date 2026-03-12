import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
function formatDate(ddmmyyyy) {
    const [d, m, y] = ddmmyyyy.split("-");
    return `${d}.${m}.${y}`;
}
export default function ConfirmationPage() {
    const { selectedRoom, searchParams, guest, reset } = useBooking();
    const navigate = useNavigate();
    const handleBackToSearch = () => {
        reset();
        navigate("/");
    };
    return (_jsx("div", { className: "bg-gray-50 flex items-center justify-center p-6 py-12", children: _jsxs("div", { className: "bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md w-full text-center", children: [_jsx("div", { className: "flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h1", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "\u0417\u0430\u044F\u0432\u043A\u0430 \u043F\u0440\u0438\u043D\u044F\u0442\u0430!" }), _jsx("p", { className: "text-sm text-gray-600 mb-6", children: "\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u0432\u0430\u0448\u0443 \u0437\u0430\u044F\u0432\u043A\u0443. \u041C\u044B \u0441\u0432\u044F\u0436\u0435\u043C\u0441\u044F \u0441 \u0432\u0430\u043C\u0438 \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F." }), selectedRoom && searchParams && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 text-left mb-6 flex flex-col gap-2 text-sm text-gray-700", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "\u041D\u043E\u043C\u0435\u0440" }), _jsx("span", { className: "font-medium", children: selectedRoom.name_ru })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "\u0417\u0430\u0435\u0437\u0434" }), _jsx("span", { className: "font-medium", children: formatDate(searchParams.dfrom) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "\u0412\u044B\u0435\u0437\u0434" }), _jsx("span", { className: "font-medium", children: formatDate(searchParams.dto) })] }), guest && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "\u0413\u043E\u0441\u0442\u044C" }), _jsxs("span", { className: "font-medium", children: [guest.name, " ", guest.surname] })] }))] })), _jsx("button", { onClick: handleBackToSearch, className: "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer", children: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043F\u043E\u0438\u0441\u043A\u0443" })] }) }));
}
