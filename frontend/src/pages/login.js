import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/authContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, role);

      // Redirect based on role
      if (role === 'participant') {
        navigate('/dashboard');
      } else if (role === 'organizer') {
        navigate('/organizer/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-white/20 p-8">
        {/* Felicity Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-gothic text-white mb-2">
            Felicity
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="border border-red-500 p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-white text-white focus:outline-none focus:border-gray-400 placeholder-gray-600"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white text-white focus:outline-none focus:border-gray-400 placeholder-gray-600 pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRole('participant')}
                className={`px-4 py-3 border text-sm transition-colors ${role === 'participant'
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-white border-white hover:bg-white/10'
                  }`}
              >
                Participant
              </button>
              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`px-4 py-3 border text-sm transition-colors ${role === 'organizer'
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-white border-white hover:bg-white/10'
                  }`}
              >
                Organizer
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`px-4 py-3 border text-sm transition-colors ${role === 'admin'
                  ? 'bg-white text-black border-white'
                  : 'bg-black text-white border-white hover:bg-white/10'
                  }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-black border border-white text-white font-semibold hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-4">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-white hover:underline underline-offset-4"
              >
                Sign Up
              </a>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-xs tracking-wider">
        </div>
      </div>
    </div>
  );
}

export default Login;