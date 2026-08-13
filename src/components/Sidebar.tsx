import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setTheme, markNotificationRead } from '../features/events/eventsSlice';
import { logout } from '../features/auth/authSlice';
import { addToast } from '../features/toast/toastSlice';

const SvgIcon: React.FC<{ d: string; viewBox?: string }> = ({ d, viewBox = '0 0 24 24' }) => (
  <svg width="16" height="16" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const MAP_ICON = 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16';
const PROFILE_ICON = 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z';
const SETTINGS_ICON = 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2 2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09z';
const LOGOUT_ICON = 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9';
const BELL_ICON = 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0';

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const profile = useAppSelector((s) => (user ? s.profile.profiles[user.id] : undefined));
  const location = useLocation();
  const theme = useAppSelector((s) => s.events.theme);
  const { notifications } = useAppSelector((s) => s.events);
  const dark = theme === 'dark';
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [showMenu, setShowMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isActive = (path: string) => {
    if (path === '/profile') {
      // only highlight own profile, not other users' profiles
      return location.pathname === '/profile' && !new URLSearchParams(location.search).get('userId');
    }
    return location.pathname === path;
  };
  const isEventPage = location.pathname.startsWith('/events/') && !location.pathname.startsWith('/my-events');

  const btn = (to: string, icon: string, label: string) => {
    const cls = isActive(to) ? 'active' : isEventPage && to === '/' ? 'partial' : '';
    return (
      <Link
        to={to}
        className={`sidebar-btn ${cls}`}
        title={label}
        onClick={() => setShowMenu(false)}
      >
        <SvgIcon d={icon} />
      </Link>
    );
  };

  return (
      <>
      <aside className="sidebar">
        <div className="sidebar-top">
          {btn('/', MAP_ICON, 'Map')}
        </div>
        <div className="sidebar-bottom">
          <button
            className="sidebar-btn"
            onClick={() => dispatch(setTheme(dark ? 'light' : 'dark'))}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
          {!isAuthenticated && (
            <Link to="/auth" className="sidebar-btn" title="Sign In">
              <SvgIcon d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4 M10 17l5-5-5-5 M13 12H3" />
            </Link>
          )}
          {isAuthenticated && (
            <div className="notif-wrap" ref={notifRef}>
              <button
                className={`sidebar-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => { setShowNotifications(!showNotifications); setShowMenu(false); }}
                title="Notifications"
              >
                <span className="notif-btn-inner">
                  <SvgIcon d={BELL_ICON} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </span>
              </button>
              {showNotifications && (
                <div className="notif-panel">
                  <div className="notif-header">
                    <span>Notifications ({notifications.length})</span>
                    <button className="notif-close" onClick={() => setShowNotifications(false)}>x</button>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="notif-list">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.read ? '' : 'unread'}`}
                          onClick={() => {
                            if (!n.read) dispatch(markNotificationRead(n.id));
                            setShowNotifications(false);
                            navigate(`/events/${n.eventId}`);
                          }}
                        >
                          <span>{n.message}</span>
                          <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="notif-empty">No notifications yet.</div>
                  )}
                </div>
              )}
            </div>
          )}
          {isAuthenticated && (
            <div className="profile-menu-wrap" ref={menuRef}>
              <button
                className={`sidebar-btn ${isActive('/profile') || isActive('/settings') ? 'active' : ''}`}
                onClick={() => setShowMenu(!showMenu)}
                title="Profile menu"
              >
                <SvgIcon d={PROFILE_ICON} />
              </button>
              {showMenu && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <div className="profile-menu-avatar">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="" />
                      ) : (
                        <span>{user!.displayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="profile-menu-info">
                      <strong>{user!.displayName}</strong>
                      <span>{user!.email}</span>
                    </div>
                  </div>
                  <div className="profile-menu-divider" />
                  <Link to="/profile" className="profile-menu-item" onClick={() => setShowMenu(false)}>
                    <SvgIcon d={PROFILE_ICON} />
                    View Profile
                  </Link>
                  <Link to="/settings" className="profile-menu-item" onClick={() => setShowMenu(false)}>
                    <SvgIcon d={SETTINGS_ICON} />
                    Settings
                  </Link>
                  <div className="profile-menu-divider" />
                  <button className="profile-menu-item signout" onClick={() => { setShowMenu(false); dispatch(logout()); dispatch(addToast({ message: 'Signed out', type: 'info' })); }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={LOGOUT_ICON} />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
              </aside>
            </>
    );
  };

export default Sidebar;