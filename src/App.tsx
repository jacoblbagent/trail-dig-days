import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { ensureSeedData } from './app/seedData';
import Navbar from './components/Navbar';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import CreateEventPage from './features/events/CreateEventPage';
import EventDetailPage from './features/events/EventDetailPage';
import MapPage from './features/map/MapPage';

const App: React.FC = () => {
  useEffect(() => { ensureSeedData(); }, []);
  return (
    <Provider store={store}>
      <HashRouter>
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dig-days" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dig-days" element={<MapPage />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
      </HashRouter>
    </Provider>
  );
};

export default App;