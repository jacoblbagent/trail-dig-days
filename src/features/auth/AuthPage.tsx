import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { login, register, verifyEmail, requestPasswordReset, resetPassword, clearPendingVerification } from './authSlice';
import { createProfile } from '../profile/profileSlice';
import { addToast } from '../toast/toastSlice';

const USER_TYPES = [
  { value: 'volunteer' as const, label: 'Volunteer', desc: 'Sign up for dig days and help build trails' },
  { value: 'organization' as const, label: 'Organization', desc: 'Create and manage dig day events' },
];

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

const AuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, pendingVerification } = useAppSelector((s) => s.auth);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('demo@trailbuilder.com');
  const [password, setPassword] = useState('demo1234');
  const [displayName, setDisplayName] = useState('Trail Builder');
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState<'volunteer' | 'organization'>('organization');

  // Forgot / Reset
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedResetToken, setGeneratedResetToken] = useState('');
  const [resetSentEmail, setResetSentEmail] = useState('');

  // Verify
  const [verifyTokenInput, setVerifyTokenInput] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // When pendingVerification is set by register.fulfilled, switch to verify mode
  useEffect(() => {
    if (pendingVerification) {
      setMode('verify');
      setEmail(pendingVerification.email);
    }
  }, [pendingVerification]);

  // Re-fill demo fields when switching login/sign-up
  useEffect(() => {
    if (mode === 'login' || mode === 'register') {
      fillDemo(demoMode);
    }
  }, [mode]);

  const fillDemo = (md: 'volunteer' | 'organization') => {
    setDemoMode(md);
    setEmail(md === 'organization' ? 'demo@trailbuilder.com' : 'demo@hiker.com');
    setPassword('demo1234');
    setDisplayName(md === 'organization' ? 'Trail Builder' : 'Trail Hiker');
    if (mode === 'register') setUserType(md);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await dispatch(login({ email, password })).unwrap();
        dispatch(addToast({ message: 'Signed in', type: 'success' }));
      } else if (mode === 'register') {
        const result = await dispatch(
          register({ email, password, displayName, userType })
        ).unwrap();
        await dispatch(
          createProfile({ userId: result.user.id, displayName })
        ).unwrap();
        dispatch(addToast({ message: 'Account created — check your email to verify', type: 'success' }));
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      if (mode !== 'verify') {
        dispatch(addToast({ message: err.message || 'Something went wrong', type: 'warning' }));
      }
    }
  };

  const handleVerify = async () => {
    setError('');
    try {
      const emailVerified = await dispatch(verifyEmail({ token: verifyTokenInput })).unwrap();
      dispatch(clearPendingVerification());
      dispatch(addToast({ message: 'Email verified! You can now sign in.', type: 'success' }));
      setEmail(emailVerified);
      setMode('login');
      setVerifyTokenInput('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      dispatch(addToast({ message: err.message || 'Verification failed', type: 'warning' }));
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await dispatch(requestPasswordReset({ email: resetEmail })).unwrap();
      setGeneratedResetToken(result.resetToken);
      setResetSentEmail(result.email);
    } catch (err: any) {
      setError(err.message || 'Failed to request reset');
      dispatch(addToast({ message: err.message || 'Failed to request reset', type: 'warning' }));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await dispatch(resetPassword({ token: resetToken, newPassword })).unwrap();
      dispatch(addToast({ message: 'Password reset! You can now sign in.', type: 'success' }));
      setMode('login');
      setPassword('');
      setResetToken('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      dispatch(addToast({ message: err.message || 'Failed to reset password', type: 'warning' }));
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setGeneratedResetToken('');
    setResetSentEmail('');
    setVerifyTokenInput('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Verify Email Screen ── */}
        {mode === 'verify' && (
          <>
            <div className="auth-header">
              <h1>Verify Your Email</h1>
              <p className="subtitle">Almost there! Check your verification link below.</p>
            </div>
            <div className="verify-box">
              <p className="muted">Sent to: <strong>{email}</strong></p>
              {pendingVerification && (
                <div className="token-display">
                  <p className="token-label">Your verification link:</p>
                  <code className="token-code" onClick={() => {
                    setVerifyTokenInput(pendingVerification.verificationToken);
                    handleVerify();
                  }}>
                    {window.location.origin}/verify?token={pendingVerification.verificationToken}
                  </code>
                  <p className="token-hint">Click the link above to verify instantly, or paste the token below:</p>
                </div>
              )}
              <div className="form-group">
                <label>Verification Token</label>
                <input
                  type="text"
                  value={verifyTokenInput}
                  onChange={(e) => setVerifyTokenInput(e.target.value)}
                  placeholder="Paste verification token..."
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <button className="btn btn-primary btn-block" onClick={handleVerify} disabled={!verifyTokenInput.trim()}>
                Verify Email
              </button>
            </div>
            <p className="auth-toggle">
              Already verified?{' '}
              <button className="link-btn" onClick={() => switchMode('login')}>
                Sign In
              </button>
            </p>
          </>
        )}

        {/* ── Forgot Password Screen ── */}
        {mode === 'forgot' && (
          <>
            <div className="auth-header">
              <h1>Reset Password</h1>
              <p className="subtitle">Enter your email to receive a reset link.</p>
            </div>
            {!generatedResetToken ? (
              <form onSubmit={handleRequestReset}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="btn btn-primary btn-block" disabled={loading || !resetEmail.trim()}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            ) : (
              <div className="verify-box">
                <p className="muted">A reset link has been generated for <strong>{resetSentEmail}</strong></p>
                <div className="token-display">
                  <p className="token-label">Your reset link:</p>
                  <code className="token-code" onClick={() => {
                    setResetToken(generatedResetToken);
                    switchMode('reset');
                  }}>
                    {window.location.origin}/reset-password?token={generatedResetToken}
                  </code>
                  <p className="token-hint">Click the link above, or copy the token and go to the reset step.</p>
                </div>
                <button className="btn btn-primary btn-block" onClick={() => {
                  setResetToken(generatedResetToken);
                  switchMode('reset');
                }}>
                  I have the token — Reset Password
                </button>
              </div>
            )}
            <p className="auth-toggle">
              Remember your password?{' '}
              <button className="link-btn" onClick={() => switchMode('login')}>
                Sign In
              </button>
            </p>
          </>
        )}

        {/* ── Reset Password Screen ── */}
        {mode === 'reset' && (
          <>
            <div className="auth-header">
              <h1>Set New Password</h1>
              <p className="subtitle">Enter your reset token and a new password.</p>
            </div>
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>Reset Token</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your reset token"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={loading || !resetToken.trim() || newPassword.length < 6}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <p className="auth-toggle">
              Need a new token?{' '}
              <button className="link-btn" onClick={() => switchMode('forgot')}>
                Request Again
              </button>
              {' or '}
              <button className="link-btn" onClick={() => switchMode('login')}>
                Sign In
              </button>
            </p>
          </>
        )}

        {/* ── Login / Register ── */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <div className="auth-header">
              <h1>Trail Dig Days</h1>
              <p className="subtitle">Build the trails you ride</p>
            </div>
            <form onSubmit={handleSubmit}>
              <h2>{mode === 'login' ? 'Welcome Back' : 'Join the Crew'}</h2>

              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your trail name or organization"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Type</label>
                    <div className="user-type-options">
                      {USER_TYPES.map((t) => (
                        <label
                          key={t.value}
                          className={`user-type-option ${userType === t.value ? 'active' : ''}`}
                        >
                          <input
                            type="radio"
                            name="userType"
                            value={t.value}
                            checked={userType === t.value}
                            onChange={() => setUserType(t.value)}
                          />
                          <span className="uto-label">{t.label}</span>
                          <span className="uto-desc">{t.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
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

              {mode === 'login' && (
                <div className="forgot-row">
                  <button type="button" className="link-btn" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="demo-section">
              <p className="demo-label">This is a demo</p>
              <div className="demo-toggles">
                <button
                  className={`demo-btn ${demoMode === 'organization' ? 'active' : ''}`}
                  onClick={() => fillDemo('organization')}
                  type="button"
                >Organization</button>
                <button
                  className={`demo-btn ${demoMode === 'volunteer' ? 'active' : ''}`}
                  onClick={() => fillDemo('volunteer')}
                  type="button"
                >Volunteer</button>
              </div>
            </div>

            <p className="auth-toggle">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button className="link-btn" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default AuthPage;