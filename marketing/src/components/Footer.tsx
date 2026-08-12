import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>Trail Dig Days</h4>
          <p>Building the trails we ride, one dig day at a time.</p>
        </div>
        <div className="footer-col">
          <h4>Pages</h4>
          <Link to="/">Home</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <div className="footer-col">
          <h4>App</h4>
          <a href="../">Open App →</a>
          <Link to="/signup">Sign Up</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Trail Dig Days. All rights reserved.</p>
      </div>
    </footer>
  );
}