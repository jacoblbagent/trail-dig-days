import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { loadEventsFromStorage } from './features/events/eventsSlice';
import Sidebar from './components/Sidebar';
import MapLayout from './components/MapLayout';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import SettingsPage from './features/profile/SettingsPage';
import CreateEventPage from './features/events/CreateEventPage';
import EditEventPage from './features/events/EditEventPage';
import MyEventsPage from './features/events/MyEventsPage';
import EventDetailPage from './features/events/EventDetailPage';
import RecurringEventsPage from './features/events/RecurringEventsPage';
import MapPage from './features/map/MapPage';
import ToastContainer from './components/ToastContainer';

const App: React.FC = () => {
  useEffect(() => { store.dispatch(loadEventsFromStorage()); }, []);
  return (
    <Provider store={store}>
      <HashRouter>
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
              <Route path="/my-events" element={<MyEventsPage />} />
              <Route path="/events/create" element={<CreateEventPage />} />
              <Route path="/events/:id/edit" element={<EditEventPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
        <ToastContainer />
      </HashRouter>
    </Provider>
  );
};

export default App;