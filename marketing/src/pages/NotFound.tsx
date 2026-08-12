import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-content not-found-page">
      <div className="container">
        <div className="not-found">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <div className="hero-cta" style={{ justifyContent: 'center' }}>
            <Link to="/" className="btn btn-primary">Go Home</Link>
            <a href="../" className="btn btn-secondary">Open App</a>
          </div>
        </div>
      </div>
    </div>
  );
}