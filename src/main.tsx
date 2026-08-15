import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ensureSeedData } from './app/seedData';
import './styles.css';

// Suppress Leaflet's deprecated MouseEvent.mozInputSource warning in Firefox
const origWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('mozInputSource')) return;
  origWarn.call(console, ...args);
};

// Seed mock data before Redux initializes
ensureSeedData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);