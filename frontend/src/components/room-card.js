import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import PhotoGallery from "./photo-gallery";
import AmenityList from "./amenity-list";
import PlanSelector from "./plan-selector";
function getFirstPlanId(room) {
    return Object.keys(room.plans)[0] ?? "";
}
export default function RoomCard({ room, amenityDefs }) {
    const navigate = useNavigate();
    const { selectRoom, selectPlan } = useBooking();
    const [selectedPlanId, setSelectedPlanId] = useState(() => getFirstPlanId(room));
    const plan = room.plans[selectedPlanId];
    function handleBook() {
        if (!plan)
            return;
        selectRoom(room);
        selectPlan(plan);
        navigate("/booking");
    }
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 flex gap-5 p-4", children: [_jsx(PhotoGallery, { photos: room.photos }), _jsxs("div", { className: "flex flex-col flex-1 gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: room.name_ru }), _jsxs("div", { className: "flex items-center gap-3 text-sm text-gray-500 mt-1", children: [_jsxs("span", { children: ["\u041C\u0430\u043A\u0441. \u0433\u043E\u0441\u0442\u0435\u0439: ", room.adults] }), _jsxs("span", { children: ["\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ", room.available] })] })] }), _jsx(AmenityList, { amenityIds: room.amenities, definitions: amenityDefs }), _jsxs("div", { className: "mt-auto flex items-end justify-between gap-4", children: [_jsxs("div", { className: "flex flex-col gap-2 flex-1", children: [_jsx(PlanSelector, { plans: room.plans, selectedPlanId: selectedPlanId, onChange: setSelectedPlanId }), plan && (_jsxs("div", { className: "text-xl font-bold text-gray-900", children: [plan.price.toLocaleString("ru-RU"), " \u20BD"] }))] }), _jsx("button", { type: "button", onClick: handleBook, disabled: !plan, className: "bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0", children: "\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] })] }));
}
