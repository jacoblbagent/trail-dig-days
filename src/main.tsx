import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ensureSeedData } from './app/seedData';
import './styles.css';

// Suppress Leaflet's deprecated MouseEvent.mozInputSource warning in Firefox
// Firefox emits a native deprecation warning when any code accesses mozInputSource.
// Override the prototype getter to return undefined and suppress the browser warning.
(function() {
  try {
    // Check if mozInputSource exists as a getter on the prototype
    var desc = Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'mozInputSource');
    if (desc && desc.get) {
      // Replace the getter to return undefined, silencing the deprecation warning
      Object.defineProperty(MouseEvent.prototype, 'mozInputSource', {
        get: function() { return undefined; },
        configurable: true,
        enumerable: true,
      });
    }
    // Also check PointerEvent for Firefox >= 112
    var pDesc = Object.getOwnPropertyDescriptor(PointerEvent.prototype, 'mozInputSource');
    if (pDesc && pDesc.get) {
      Object.defineProperty(PointerEvent.prototype, 'mozInputSource', {
        get: function() { return undefined; },
        configurable: true,
        enumerable: true,
      });
    }
  } catch(e) {
    // Ignore — won't break anything if patching fails
  }
})();

// Seed mock data before Redux initializes
ensureSeedData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);