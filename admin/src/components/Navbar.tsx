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

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(TABS[newValue].path);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ mr: 4 }}>
          Apart-NN Admin
        </Typography>
        <Tabs value={activeTab} onChange={handleChange} textColor="inherit" indicatorColor="secondary">
          {TABS.map((tab) => (
            <Tab key={tab.path} label={tab.label} />
          ))}
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
