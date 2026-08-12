import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-subtitle">Last updated: August 2026</p>

        <div className="legal-content">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Trail Dig Days, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>

          <h2>2. Description of Service</h2>
          <p>Trail Dig Days is a web application that connects volunteers with trail organizations for the purpose of trail building, maintenance, and stewardship events.</p>

          <h2>3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when creating an account. You may not use another person's account without permission.</p>

          <h2>4. User Conduct</h2>
          <p>You agree to use Trail Dig Days responsibly. You may not:</p>
          <ul>
            <li>Use the platform for any unlawful purpose</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Create false or misleading event listings</li>
            <li>Attempt to disrupt or compromise the platform</li>
          </ul>

          <h2>5. Event Participation</h2>
          <p>Trail Dig Days is a coordination platform. We are not responsible for the conduct of event organizers or participants. By attending events, you acknowledge that trail work involves inherent risks, and you participate at your own discretion.</p>

          <h2>6. Intellectual Property</h2>
          <p>The Trail Dig Days name, logo, and platform design are our intellectual property. You may not reproduce, distribute, or create derivative works without permission.</p>

          <h2>7. Limitation of Liability</h2>
          <p>Trail Dig Days is provided "as is" without warranties of any kind. We are not liable for damages arising from your use of the platform or participation in listed events.</p>

          <h2>8. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance of the new terms.</p>

          <h2>9. Contact</h2>
          <p>For questions about these terms, please <Link to="/contact">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}