import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="not-found-page">
    <div className="not-found-inner">
      <div className="not-found-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="7" />
          <polyline points="12 15 12 8" />
          <line x1="8" y1="12" x2="12" y2="9" />
          <line x1="16" y1="12" x2="12" y2="9" />
          <path d="M5 21a12 12 0 0 1 14 0" />
        </svg>
      </div>
      <h1>404</h1>
      <p className="not-found-title">Lost Trail</p>
      <p className="not-found-text">
        Looks like this trail hasn't been built yet — or it washed out.
        Head back to the map and find a dig day that's still on the books.
      </p>
      <Link to="/" className="btn btn-primary">Back to the Map</Link>
    </div>
  </div>
);

export default NotFoundPage;
