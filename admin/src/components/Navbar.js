import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
const TABS = [
    { label: 'Коэффициенты', path: '/' },
    { label: 'Настройки', path: '/settings' },
];
export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentTab = TABS.findIndex((t) => t.path === location.pathname);
    const activeTab = currentTab === -1 ? 0 : currentTab;
    const handleChange = (_, newValue) => {
        navigate(TABS[newValue].path);
    };
    return (_jsx(AppBar, { position: "static", children: _jsxs(Toolbar, { children: [_jsx(Typography, { variant: "h6", sx: { mr: 4 }, children: "Apart-NN Admin" }), _jsx(Tabs, { value: activeTab, onChange: handleChange, textColor: "inherit", indicatorColor: "secondary", children: TABS.map((tab) => (_jsx(Tab, { label: tab.label }, tab.path))) })] }) }));
}
