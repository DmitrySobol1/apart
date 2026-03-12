import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        if (!root)
            return;
        const sendHeight = () => {
            window.parent.postMessage({ type: "resize", height: root.scrollHeight }, "*");
        };
        const observer = new ResizeObserver(sendHeight);
        observer.observe(root);
        sendHeight();
        return () => observer.disconnect();
    }, []);
}
function PageWrapper({ children }) {
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
    return (_jsx("div", { className: "page-enter", children: children }, location.pathname));
}
function GuardedRoute({ children }) {
    const { searchParams } = useBooking();
    if (!searchParams)
        return _jsx(Navigate, { to: "/", replace: true });
    return children;
}
function AppRoutes() {
    return (_jsx(PageWrapper, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(SearchPage, {}) }), _jsx(Route, { path: "/rooms", element: _jsx(GuardedRoute, { children: _jsx(RoomsPage, {}) }) }), _jsx(Route, { path: "/booking", element: _jsx(GuardedRoute, { children: _jsx(BookingPage, {}) }) }), _jsx(Route, { path: "/confirmation", element: _jsx(ConfirmationPage, {}) })] }) }));
}
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsx(BookingProvider, { children: _jsx(AppRoutes, {}) }) }));
}
