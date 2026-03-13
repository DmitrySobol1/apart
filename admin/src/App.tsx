import { createTheme, ThemeProvider } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import CoefficientsPage from './pages/CoefficientsPage';
import { Typography } from '@mui/material';

const theme = createTheme();

function SettingsPage() {
  return <Typography sx={{ p: 3 }}>Coming soon</Typography>;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<CoefficientsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
