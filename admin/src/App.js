import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createTheme, ThemeProvider } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import CoefficientsPage from './pages/CoefficientsPage';
import { Typography } from '@mui/material';
const theme = createTheme();
function SettingsPage() {
    return _jsx(Typography, { sx: { p: 3 }, children: "Coming soon" });
}
export default function App() {
    return (_jsx(ThemeProvider, { theme: theme, children: _jsxs(BrowserRouter, { children: [_jsx(Navbar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(CoefficientsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) })] })] }) }));
}
