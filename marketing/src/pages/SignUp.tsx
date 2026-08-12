import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { register, clearError } from '../slices/authSlice';

export default function SignUp() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.auth.error);
  const user = useAppSelector((s) => s.auth.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');

  if (user) {
    return (
      <div className="page-content">
        <div className="container">
          <div className="signup-success">
            <h1>Welcome, {user.displayName}! 🎉</h1>
            <p>Your account has been created and you're signed in.</p>
            <div className="hero-cta" style={{ justifyContent: 'center', marginTop: 24 }}>
              <a href="../" className="btn btn-primary btn-lg">Go to the App →</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (!email || !password || !displayName) return;
    if (password.length < 6) return;
    dispatch(register({ email, password, displayName, userType }));
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="signup-page">
          <h1 className="page-title">Join Trail Dig Days</h1>
          <p className="page-subtitle">Create your free account and start building the trails you love.</p>
          <div className="signup-form-wrap">
            {error && <div className="form-error">{error}</div>}
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Your name or org name" />
              </div>
              <div className="form-group">
                <label htmlFor="type">Account Type</label>
                <select id="type" value={userType} onChange={(e) => setUserType(e.target.value as any)}>
                  <option value="volunteer">Volunteer — Join trail work days</option>
                  <option value="organization">Organization — Create and manage events</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Create Account</button>
              <p className="form-note">Already have an account? <a href="../">Sign in →</a></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}