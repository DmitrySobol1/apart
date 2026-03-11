import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <div className="p-4 text-gray-800">
      <h1 className="text-2xl font-bold">Apart-NN Booking</h1>
    </div>
  </StrictMode>,
);
