import { Link } from 'react-router-dom';

const faqs = [
  {
    q: 'What is Trail Dig Days?',
    a: 'Trail Dig Days is a platform that connects volunteers with local trail organizations to plan, promote, and participate in trail building and maintenance events. Think of it as a hub for everything related to trail stewardship in your community.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes! Trail Dig Days is completely free for both volunteers and organizations. There are no subscription fees, hidden charges, or premium tiers.',
  },
  {
    q: 'How do I find events near me?',
    a: 'Open the app and use the interactive map to browse events. You can filter by distance from your location, date range, and event type. The map shows all upcoming dig days in your area.',
  },
  {
    q: 'How do I create an account?',
    a: 'Click the "Get Started" or "Join" button on any page, fill in your email, password, and display name, and choose whether you\'re joining as a volunteer or an organization.',
  },
  {
    q: 'Can I create events as a volunteer?',
    a: 'Only organization accounts can create events. If you\'re part of a trail organization, sign up with an organization account. Volunteers can browse, RSVP, and participate in events.',
  },
  {
    q: 'How do I change my account type?',
    a: 'Account types are set during registration. To switch from volunteer to organization (or vice versa), contact us and we\'ll help you update your account.',
  },
  {
    q: 'What should I bring to a dig day?',
    a: 'Each event lists what\'s being provided and what volunteers should bring. Generally, bring work gloves, sturdy boots, water, and weather-appropriate clothing. Tools are often provided, but check the event details.',
  },
  {
    q: 'How do I track my volunteer hours?',
    a: 'After RSVPing to an event, your participation is recorded in your profile. Organizations can see who attended, and your volunteer history is visible on your profile page.',
  },
  {
    q: 'Can I organize a recurring event?',
    a: 'Yes! When creating an event, you can set it as recurring (weekly, monthly, etc.). This is great for regular trail maintenance days.',
  },
  {
    q: 'How is my data handled?',
    a: 'We take your privacy seriously. Your data is stored locally in your browser and is only used to provide the Trail Dig Days experience. See our <Link to="/privacy">Privacy Policy</Link> for details.',
  },
];

export default function FAQ() {
  return (
    <div className="page-content">
      <div className="container">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">Everything you need to know about Trail Dig Days.</p>
        <div className="faq-list">
          {faqs.map((item, i) => (
            <details key={i} className="faq-item">
              <summary>{item.q}</summary>
              <p dangerouslySetInnerHTML={{ __html: item.a }} />
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}