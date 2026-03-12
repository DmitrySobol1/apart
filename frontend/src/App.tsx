import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BookingProvider, useBooking } from "./context/BookingContext";
import SearchPage from "./pages/SearchPage";
import RoomsPage from "./pages/RoomsPage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";

function useIframeResize() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    const sendHeight = () => {
      window.parent.postMessage({ type: "resize", height: root.scrollHeight }, "*");
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(root);

    sendHeight();

    return () => observer.disconnect();
  }, []);
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useIframeResize();

  useEffect(() => {
    window.scrollTo(0, 0);
    const root = document.getElementById("root");
    if (root) {
      window.parent.postMessage({ type: "resize", height: root.scrollHeight }, "*");
    }
    window.parent.postMessage({ type: "scrollToWidget" }, "*");
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}

function GuardedRoute({ children }: { children: JSX.Element }) {
  const { searchParams } = useBooking();
  if (!searchParams) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <PageWrapper>
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
    </PageWrapper>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <AppRoutes />
      </BookingProvider>
    </BrowserRouter>
  );
}
