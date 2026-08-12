import React, { useEffect } from 'react';
import { BrowserRouter, Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useAppSelector } from './app/hooks';
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
import MapPage from './features/map/MapPage';
import NotFoundPage from './pages/NotFoundPage';
import ToastContainer from './components/ToastContainer';

const TopNav: React.FC = () => {
  const currentUser = useAppSelector((s) => s.auth.user);
  const canCreate = currentUser?.userType === 'organization';
  return (
    <header className="top-nav">
      <span className="top-nav-title">Dig Days</span>
      {canCreate && <Link to="/events/create" className="btn btn-primary btn-sm">+ New</Link>}
    </header>
  );
};

const RedirectHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
      const path = redirect.startsWith(basename) ? redirect.slice(basename.length) || '/' : redirect;
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return <>{children}</>;
};

const ROUTES = [
  '/', '/auth', '/my-events', '/events/create',
  '/profile', '/settings',
];

const isKnownRoute = (pathname: string) =>
  ROUTES.includes(pathname) ||
  pathname.startsWith('/events/') ||
  pathname.startsWith('/profile/');

const AppRoutes: React.FC = () => {
  const location = useLocation();
  if (!isKnownRoute(location.pathname)) {
    return <NotFoundPage />;
  }
  return (
    <Routes>
      <Route element={<MapLayout />}>
        <Route path="/" element={<MapPage />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/my-events" element={<MyEventsPage />} />
      <Route path="/events/create" element={<CreateEventPage />} />
      <Route path="/events/:id/edit" element={<EditEventPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => { store.dispatch(loadEventsFromStorage()); }, []);
  return (
    <Provider store={store}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <RedirectHandler>
          <TopNav />
          <div className="app-layout">
            <Sidebar />
            <main className="app-main">
              <AppRoutes />
            </main>
          </div>
          <ToastContainer />
        </RedirectHandler>
      </BrowserRouter>
    </Provider>
  );
};

export default App;