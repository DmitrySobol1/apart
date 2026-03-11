import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider, useBooking } from './context/BookingContext';
import SearchPage from './pages/SearchPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';

function GuardedRoute({ children }: { children: JSX.Element }) {
  const { searchParams } = useBooking();
  if (!searchParams) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route
            path="/rooms"
            element={
              <GuardedRoute>
                <RoomsPage />
              </GuardedRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <GuardedRoute>
                <BookingPage />
              </GuardedRoute>
            }
          />
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
