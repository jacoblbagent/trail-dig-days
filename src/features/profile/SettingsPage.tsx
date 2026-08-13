import React from 'react';
import { Link } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <Link to="/" className="event-detail-page-back"><span className="nav-arrow">←</span> Back</Link>
        <h1>Settings</h1>
      </div>
      <div className="page-message" style={{ marginTop: 40 }}>
        <p>All settings have moved to <Link to="/profile">your profile page</Link> — click Edit to update your info.</p>
      </div>
    </div>
  );
};

export default SettingsPage;