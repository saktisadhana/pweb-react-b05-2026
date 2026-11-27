import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Font dari Figma, dibundel lokal (tidak bergantung Google Fonts).
import '@fontsource/bitcount-single/400.css';
import '@fontsource/bitcount-single/700.css';
import '@fontsource/bitcount-prop-single/400.css';
import '@fontsource/bitcount-prop-single/700.css';
import './styles/seno.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
