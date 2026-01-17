import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { admin, loginAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await adminAPI.login({ email, password });
      // Store admin token separately
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('token', response.data.token);
      loginAdmin(response.data.token, response.data.admin);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-xl mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
          <p className="text-gray-400 mt-2">Sign in to access the dashboard</p>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="admin@sportsteam.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
            <p className="text-sm text-gray-400 mb-2">Test Credentials:</p>
            <p className="text-sm text-gray-300">
              Email: <code className="text-indigo-400">admin@sportsteam.com</code>
            </p>
            <p className="text-sm text-gray-300">
              Password: <code className="text-indigo-400">Admin@123</code>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
