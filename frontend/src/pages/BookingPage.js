import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import client from "../api/client";
import GuestForm from "../components/guest-form";
import BookingSummary from "../components/booking-summary";
import LoadingSpinner from "../components/loading-spinner";
import ErrorMessage from "../components/error-message";
export default function BookingPage() {
    const { selectedRoom, selectedPlan, searchParams, setGuest } = useBooking();
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [guestData, setGuestData] = useState(null);
    const [formValid, setFormValid] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    if (!selectedRoom || !selectedPlan || !searchParams) {
        return null;
    }
    const canSubmit = formValid && agreed && !loading;
    const handleFormChange = (valid, data) => {
        setFormValid(valid);
        setGuestData(data);
    };
    const handleSubmit = async () => {
        if (submittingRef.current || !canSubmit || !guestData)
            return;
        submittingRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const response = await client.post("/booking", {
                dfrom: searchParams.dfrom,
                dto: searchParams.dto,
                planId: selectedPlan.id,
                adults: searchParams.adults,
                roomTypeId: selectedRoom.id,
                guest: guestData,
            });
            if (!response.data.success) {
                setError(response.data.message ?? "Произошла ошибка. Попробуйте ещё раз.");
                return;
            }
            setGuest(guestData);
            navigate("/confirmation", {
                state: {
                    paymentUrl: response.data.paymentUrl,
                    bookingNumber: response.data.bookingNumber,
                    amount: response.data.amount,
                },
            });
        }
        catch {
            setError("Не удалось создать бронирование. Попробуйте ещё раз.");
        }
        finally {
            setLoading(false);
            submittingRef.current = false;
        }
    };
    return (_jsx("div", { className: "bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435 \u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }), _jsx(Link, { to: "/rooms", className: "text-sm text-blue-600 hover:underline", children: "\u2190 \u041D\u0430\u0437\u0430\u0434 \u043A \u043D\u043E\u043C\u0435\u0440\u0430\u043C" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-6", children: [_jsxs("div", { className: "col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm", children: [_jsx("h2", { className: "text-base font-semibold text-gray-800 mb-4", children: "\u0414\u0430\u043D\u043D\u044B\u0435 \u0433\u043E\u0441\u0442\u044F" }), _jsx(GuestForm, { onValidChange: handleFormChange, disabled: loading }), _jsxs("div", { className: "mt-6 flex items-start gap-2", children: [_jsx("input", { id: "agree", type: "checkbox", checked: agreed, onChange: (e) => setAgreed(e.target.checked), disabled: loading, className: "mt-0.5 cursor-pointer" }), _jsx("label", { htmlFor: "agree", className: "text-sm text-gray-700 cursor-pointer", children: "\u042F \u0441\u043E\u0433\u043B\u0430\u0441\u0435\u043D \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445" })] }), error && (_jsxs("div", { className: "mt-4", children: [_jsx(ErrorMessage, { message: error }), _jsx("button", { onClick: handleSubmit, disabled: !canSubmit, className: "mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors cursor-pointer", children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })] })), _jsx("button", { onClick: handleSubmit, disabled: !canSubmit, className: `mt-6 w-full py-3 rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 ${canSubmit
                                        ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                        : "bg-gray-300 cursor-not-allowed"}`, children: loading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430..."] })) : ("Забронировать") })] }), _jsx("div", { className: "col-span-1", children: _jsx(BookingSummary, { room: selectedRoom, plan: selectedPlan, searchParams: searchParams }) })] })] }) }));
}
