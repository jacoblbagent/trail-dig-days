import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">Privacy Policy</h1>
        <p className="page-subtitle">Last updated: August 2026</p>

        <div className="legal-content">
          <h2>1. Information We Collect</h2>
          <p>When you create an account on Trail Dig Days, we collect the following information:</p>
          <ul>
            <li>Email address</li>
            <li>Display name</li>
            <li>Account type (volunteer or organization)</li>
            <li>Event preferences and volunteer history</li>
            <li>Geolocation data (only when you grant permission to find nearby events)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Trail Dig Days platform</li>
            <li>Connect you with relevant trail events and organizations</li>
            <li>Track event participation and volunteer hours</li>
            <li>Communicate about events you've signed up for</li>
          </ul>

          <h2>3. Data Storage</h2>
          <p>Trail Dig Days stores your account information locally in your browser using localStorage. This means your data stays on your device and is not transmitted to external servers. The data is used solely to power your experience within the app.</p>

          <h2>4. Third-Party Services</h2>
          <p>We use leaflet (via react-leaflet) for map rendering. Map tiles are served from OpenStreetMap. No personal data is shared with these services beyond standard web requests.</p>

          <h2>5. Your Choices</h2>
          <p>You can:</p>
          <ul>
            <li>Edit your profile information at any time</li>
            <li>Delete your account by clearing your browser data for this site</li>
            <li>Choose whether to share your geolocation for nearby event search</li>
          </ul>

          <h2>6. Contact</h2>
          <p>If you have questions about this privacy policy, please <Link to="/contact">contact us</Link>.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.</p>
        </div>
      </div>
    </div>
  );
}