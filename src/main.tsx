import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ensureSeedData } from './app/seedData';
import './styles.css';

// Seed mock data before Redux initializes
ensureSeedData();

// Recover redirect from GH Pages 404.html (saves path on refresh)
const redirectTarget = sessionStorage.getItem('redirect');
if (redirectTarget) {
  sessionStorage.removeItem('redirect');
  // Rewrite the URL before React renders so BrowserRouter picks up the right path
  window.history.replaceState(null, '', redirectTarget);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);