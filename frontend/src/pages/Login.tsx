import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Login.css';

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email);
      } else {
        await register(email, name);
      }
      navigate('/');
    } catch (err) {
      setError(
        mode === 'login'
          ? 'Login failed. Email not found.'
          : 'Registration failed. Email might already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    try {
      await login('test@example.com');
      navigate('/');
    } catch (err) {
      setError('Quick login failed. Test user might not exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Continue your learning journey'
            : 'Start your English learning journey'}
        </p>

        <div className="mode-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="quick-login-button"
          onClick={handleQuickLogin}
          disabled={loading}
        >
          Quick Login (Test User)
        </button>
      </div>
    </div>
  );
}

export default Login;
