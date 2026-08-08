import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import Navbar from './components/Navbar';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import CreateEventPage from './features/events/CreateEventPage';
import EventDetailPage from './features/events/EventDetailPage';
import MapPage from './features/map/MapPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
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
      </BrowserRouter>
    </Provider>
  );
};

export default App;