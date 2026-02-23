import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Login attempt started');

    try {
      // HACK: trying all 3 roles since frontend doesn't know which one
      let userData;
      try {
        console.log('Trying admin login...');
        userData = await login(email, password, 'admin');
        console.log('Admin login successful:', userData);
        navigate('/admin/dashboard');
        return;
      } catch (err) {
        console.log('Admin login failed:', err.message);
        try {
          console.log('Trying organizer login...');
          userData = await login(email, password, 'organizer');
          console.log('Organizer login successful:', userData);
          navigate('/organizer/dashboard');
          return;
        } catch (err2) {
          console.log('Organizer login failed:', err2.message);
          try {
            console.log('Trying participant login...');
            userData = await login(email, password, 'participant');
            console.log('Participant login successful:', userData);
            navigate('/dashboard');
            return;
          } catch (err3) {
            console.log('Participant login failed:', err3.message);
            throw new Error('Invalid email or password');
          }
        }
      }
    } catch (error) {
      console.log('Final error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', minHeight: '100vh' }}>
      <h1>Felicity</h1>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{ color: 'black', padding: '5px', width: '300px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{ color: 'black', padding: '5px', width: '300px' }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ marginLeft: '10px' }}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" disabled={isLoading} style={{ padding: '8px 16px' }}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <div style={{ marginTop: '15px' }}>
          <p>
            Don't have an account? <a href="/register">Sign Up</a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;