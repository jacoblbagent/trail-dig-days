import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { loadEventsFromStorage } from './features/events/eventsSlice';
import Sidebar from './components/Sidebar';
import MapLayout from './components/MapLayout';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import SettingsPage from './features/profile/SettingsPage';
import CreateEventPage from './features/events/CreateEventPage';
import EventDetailPage from './features/events/EventDetailPage';
import RecurringEventsPage from './features/events/RecurringEventsPage';
import MapPage from './features/map/MapPage';

const App: React.FC = () => {
  useEffect(() => { store.dispatch(loadEventsFromStorage()); }, []);
  return (
    <Provider store={store}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="app-layout">
          <Sidebar />
          <main className="app-main">
            <Routes>
              {/* Map-backed routes share the same MapContainer via MapLayout */}
              <Route element={<MapLayout />}>
                <Route path="/" element={<MapPage />} />
                <Route path="/events/recurring" element={<RecurringEventsPage />} />
              </Route>
              {/* Standalone routes (no map) */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/events/create" element={<CreateEventPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;