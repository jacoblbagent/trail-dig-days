import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Find Events Near You',
    desc: 'Browse trail building and maintenance events on an interactive map. Filter by date, location, and activity type.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Organize Volunteers',
    desc: 'Create events, track RSVPs, and communicate with volunteers. Know exactly who is coming.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Track Tools & Gear',
    desc: 'List what you are providing and what volunteers should bring. Everyone comes prepared.',
  },
];

const steps = [
  { num: 1, title: 'Create an Account', desc: 'Sign up as a volunteer or organization. Set your preferences and area.' },
  { num: 2, title: 'Find or Create Events', desc: 'Browse the map for upcoming work days or create your own.' },
  { num: 3, title: 'Show Up & Dig', desc: 'RSVP, bring your gear, and join the community building the trails.' },
];

const testimonials = [
  { text: '"Trail Dig Days made it so easy to find work days near Brevard. I have already been to three events and met great people."', author: 'Mike R.', role: 'Volunteer, Pisgah Forest' },
  { text: '"As a small trail organization, managing volunteers used to mean spreadsheets and text chains. Now everything is in one place."', author: 'Sarah K.', role: 'Galbraith Crew Organizer' },
  { text: '"The map view is a game-changer. I can see exactly where events are happening and how far they are from my house."', author: 'Daryl W.', role: 'Volunteer, Hendersonville' },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Build the <span>Trails</span> You Ride</h1>
          <p className="hero-p">Trail Dig Days connects volunteers with local trail organizations to plan, promote, and participate in trail building and maintenance events.</p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
            <a href="../" className="btn btn-secondary btn-lg">Open App →</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-num">50+</div><div className="hero-stat-label">Events This Year</div></div>
            <div className="hero-stat"><div className="hero-stat-num">20+</div><div className="hero-stat-label">Organizations</div></div>
            <div className="hero-stat"><div className="hero-stat-num">1,200+</div><div className="hero-stat-label">Volunteers</div></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features">
        <div className="container">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">From finding local trail work days to organizing volunteers — Trail Dig Days makes trail stewardship simple.</p>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Whether you are a seasoned trail steward or a first-time volunteer, getting involved is easy.</p>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.num} className="step">
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section id="audience">
        <div className="container">
          <h2 className="section-title">Who It Is For</h2>
          <p className="section-subtitle">Trail Dig Days brings together everyone who cares about great trails.</p>
          <div className="whom-grid">
            <div className="whom-card">
              <h3>Volunteers</h3>
              <ul>
                <li>Discover trail work days near you</li>
                <li>RSVP and track your volunteer hours</li>
                <li>Get notified about new events in your area</li>
                <li>Connect with local trail organizations</li>
              </ul>
            </div>
            <div className="whom-card">
              <h3>Organizations</h3>
              <ul>
                <li>Create and manage dig day events</li>
                <li>Track volunteer registrations</li>
                <li>List provided tools and gear needs</li>
                <li>Communicate with your volunteers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="container">
          <h2 className="section-title">From the Community</h2>
          <p className="section-subtitle">What volunteers and organizers are saying.</p>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial">
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">{t.author}</div>
                <div className="testimonial-role">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Get Digging?</h2>
          <p>Join hundreds of volunteers and trail organizations already using Trail Dig Days.</p>
          <Link to="/signup" className="btn btn-primary btn-lg">Create Your Free Account</Link>
        </div>
      </section>
    </>
  );
}