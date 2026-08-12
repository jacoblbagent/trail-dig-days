import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    // In production this would send to an API/email service
  };

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-subtitle">Have a question, suggestion, or issue? We'd love to hear from you.</p>

        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get in Touch</h3>
            <p>Whether you're a volunteer with a question, an organization looking to get set up, or just want to say hello — drop us a message and we'll get back to you.</p>
            <div className="contact-detail">
              <strong>Email:</strong> <a href="mailto:hello@traildigdays.com">hello@traildigdays.com</a>
            </div>
            <div className="contact-detail">
              <strong>App:</strong> <a href="../">Open Trail Dig Days →</a>
            </div>
          </div>

          <div className="contact-form-wrap">
            {sent ? (
              <div className="form-success">
                <p>🎉 Message sent! We'll get back to you as soon as possible.</p>
                <Link to="/" className="btn btn-primary">Back to Home</Link>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input type="text" id="subject" name="subject" required placeholder="What's this about?" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows={5} required placeholder="Tell us more..." />
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}