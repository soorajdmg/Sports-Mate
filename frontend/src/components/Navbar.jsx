import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚽</span>
              <span className="text-white font-bold text-xl">SportsMate</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-white hover:text-indigo-200 transition-colors px-3 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  to="/discover"
                  className="text-white hover:text-indigo-200 transition-colors px-3 py-2"
                >
                  Find Teammates
                </Link>
                <Link
                  to="/profile"
                  className="text-white hover:text-indigo-200 transition-colors px-3 py-2"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-indigo-200 transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
