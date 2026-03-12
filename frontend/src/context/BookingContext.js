import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const initialState = {
    searchParams: null,
    rooms: null,
    selectedRoom: null,
    selectedPlan: null,
    guest: null,
};
const BookingContext = createContext(null);
export function BookingProvider({ children }) {
    const [state, setState] = useState(initialState);
    const setSearchParams = (params) => setState((prev) => ({ ...prev, searchParams: params }));
    const setRooms = (rooms) => setState((prev) => ({ ...prev, rooms }));
    const selectRoom = (room) => setState((prev) => ({ ...prev, selectedRoom: room }));
    const selectPlan = (plan) => setState((prev) => ({ ...prev, selectedPlan: plan }));
    const setGuest = (guest) => setState((prev) => ({ ...prev, guest }));
    const reset = () => setState(initialState);
    return (_jsx(BookingContext.Provider, { value: { ...state, setSearchParams, setRooms, selectRoom, selectPlan, setGuest, reset }, children: children }));
}
export function useBooking() {
    const ctx = useContext(BookingContext);
    if (!ctx)
        throw new Error("useBooking must be used within BookingProvider");
    return ctx;
}
