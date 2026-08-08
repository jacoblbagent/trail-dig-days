import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, register } from './authSlice';
import { createProfile } from '../profile/profileSlice';

const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAppSelector((s) => s.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@trailbuilder.com');
  const [password, setPassword] = useState('demo1234');
  const [displayName, setDisplayName] = useState('Trail Builder');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dig-days');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await dispatch(login({ email, password })).unwrap();
      } else {
        const user = await dispatch(
          register({ email, password, displayName })
        ).unwrap();
        await dispatch(
          createProfile({ userId: user.id, displayName })
        ).unwrap();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Trail Dig Days</h1>
          <p className="subtitle">Build the trails you ride</p>
        </div>
        <form onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Welcome Back' : 'Join the Crew'}</h2>
          {!isLogin && (
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your trail name"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="link-btn" onClick={() => {
            setIsLogin(!isLogin);
            if (isLogin) {
              setDisplayName('Trail Builder');
              setEmail('builder@trail.com');
              setPassword('password123');
            } else {
              setEmail('demo@trailbuilder.com');
              setPassword('demo1234');
            }
            setError('');
          }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;