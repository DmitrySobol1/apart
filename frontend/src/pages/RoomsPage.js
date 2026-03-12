import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import client from "../api/client";
import RoomCard from "../components/room-card";
function flattenAmenities(groups) {
    const result = {};
    for (const group of Object.values(groups)) {
        for (const [id, def] of Object.entries(group.amenities)) {
            result[id] = { id, ...def };
        }
    }
    return result;
}
function getMinPrice(room) {
    const prices = Object.values(room.plans).map((p) => p.price);
    return prices.length > 0 ? Math.min(...prices) : Infinity;
}
function formatApiDate(apiDate) {
    const [d, m, y] = apiDate.split("-");
    return `${d}.${m}.${y}`;
}
export default function RoomsPage() {
    const { searchParams, rooms } = useBooking();
    const [amenityDefs, setAmenityDefs] = useState({});
    useEffect(() => {
        client
            .get("/amenities")
            .then((res) => setAmenityDefs(flattenAmenities(res.data.amenities)))
            .catch(() => { });
    }, []);
    if (!searchParams || !rooms)
        return null;
    const filtered = rooms
        .filter((r) => r.available > 0 && r.adults >= searchParams.adults)
        .sort((a, b) => getMinPrice(a) - getMinPrice(b));
    return (_jsx("div", { className: "bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-6 flex items-start justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-600", children: ["\u0417\u0430\u0435\u0437\u0434: ", _jsx("strong", { children: formatApiDate(searchParams.dfrom) }), " · ", "\u0412\u044B\u0435\u0437\u0434: ", _jsx("strong", { children: formatApiDate(searchParams.dto) }), " · ", "\u0413\u043E\u0441\u0442\u0435\u0439: ", _jsx("strong", { children: searchParams.adults })] }) }), _jsx(Link, { to: "/", className: "text-sm text-blue-600 hover:underline", children: "\u2190 \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B" })] }), filtered.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u043D\u043E\u043C\u0435\u0440\u043E\u0432 \u043D\u0430 \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u0442\u044B. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u0438\u0435 \u0434\u0430\u0442\u044B." }), _jsx(Link, { to: "/", className: "text-blue-600 hover:underline", children: "\u2190 \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A \u043F\u043E\u0438\u0441\u043A\u0443" })] })) : (_jsx("div", { className: "flex flex-col gap-4", children: filtered.map((room) => (_jsx(RoomCard, { room: room, amenityDefs: amenityDefs }, room.id))) }))] }) }));
}
