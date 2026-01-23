import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Container, Card, Button } from '../components/ui';

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
    <Container size="sm" className="py-10">
      <Card className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-text-secondary text-center mb-6">
          {mode === 'login'
            ? 'Continue your learning journey'
            : 'Start your English learning journey'}
        </p>

        {/* Mode Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-button p-1 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded-button text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white dark:bg-gray-700 text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-button text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white dark:bg-gray-700 text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 border border-border rounded-card bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border border-border rounded-card bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-card text-error text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Login'
              : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-sm">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleQuickLogin}
          disabled={loading}
        >
          Quick Login (Test User)
        </Button>
      </Card>
    </Container>
  );
}

export default Login;
