import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {' '}
              Sports Teammate
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Connect with local sports enthusiasts in your area. Whether you play
            football, cricket, badminton, or any other sport - find your next teammate
            today!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/discover"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Find Teammates
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose SportsMate?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Sport-Specific Matching
            </h3>
            <p className="text-gray-600">
              Filter teammates by your favorite sport. Find players who share your
              passion.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl">📍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Location-Based Discovery
            </h3>
            <p className="text-gray-600">
              Find teammates in your city or neighborhood. Play locally, connect
              easily.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-3xl">🟢</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Real-Time Availability
            </h3>
            <p className="text-gray-600">
              See who's active right now. Connect with teammates ready to play
              today.
            </p>
          </div>
        </div>
      </div>

      {/* Sports Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Sports We Support
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: '⚽', name: 'Football' },
              { icon: '🏏', name: 'Cricket' },
              { icon: '🏸', name: 'Badminton' },
              { icon: '🎾', name: 'Tennis' },
              { icon: '🏀', name: 'Basketball' },
              { icon: '🏐', name: 'Volleyball' },
              { icon: '🏑', name: 'Hockey' },
              { icon: '🏊', name: 'Swimming' },
            ].map((sport) => (
              <div
                key={sport.name}
                className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-xl flex items-center space-x-3 hover:bg-white/30 transition-colors"
              >
                <span className="text-3xl">{sport.icon}</span>
                <span className="text-white font-medium">{sport.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Teammates?
          </h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Join thousands of sports enthusiasts who have found their perfect match.
            Sign up now and start playing!
          </p>
          {!user && (
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-all"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 SportsMate. Built for sports enthusiasts, by sports enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
