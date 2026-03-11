import { createContext, useContext, useState, ReactNode } from 'react';
import type { Room, RoomPlan, GuestData, SearchParams } from '../types';

interface BookingState {
  searchParams: SearchParams | null;
  rooms: Room[] | null;
  selectedRoom: Room | null;
  selectedPlan: RoomPlan | null;
  guest: GuestData | null;
}

interface BookingActions {
  setSearchParams: (params: SearchParams) => void;
  setRooms: (rooms: Room[]) => void;
  selectRoom: (room: Room) => void;
  selectPlan: (plan: RoomPlan) => void;
  setGuest: (guest: GuestData) => void;
  reset: () => void;
}

type BookingContextValue = BookingState & BookingActions;

const initialState: BookingState = {
  searchParams: null,
  rooms: null,
  selectedRoom: null,
  selectedPlan: null,
  guest: null,
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initialState);

  const setSearchParams = (params: SearchParams) =>
    setState((prev) => ({ ...prev, searchParams: params }));

  const setRooms = (rooms: Room[]) =>
    setState((prev) => ({ ...prev, rooms }));

  const selectRoom = (room: Room) =>
    setState((prev) => ({ ...prev, selectedRoom: room }));

  const selectPlan = (plan: RoomPlan) =>
    setState((prev) => ({ ...prev, selectedPlan: plan }));

  const setGuest = (guest: GuestData) =>
    setState((prev) => ({ ...prev, guest }));

  const reset = () => setState(initialState);

  return (
    <BookingContext.Provider
      value={{ ...state, setSearchParams, setRooms, selectRoom, selectPlan, setGuest, reset }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
