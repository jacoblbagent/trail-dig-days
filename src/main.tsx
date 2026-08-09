import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ensureSeedData } from './app/seedData';
import './styles.css';

// Seed mock data before Redux initializes
ensureSeedData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);