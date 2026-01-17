import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import TeammateCard from '../components/TeammateCard';

const sportIcons = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  tennis: '🎾',
  basketball: '🏀',
  volleyball: '🏐',
  hockey: '🏑',
  swimming: '🏊',
};

const Dashboard = () => {
  const { user } = useAuth();
  const [nearbyData, setNearbyData] = useState(null);
  const [activeTeammates, setActiveTeammates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nearbyRes, activeRes] = await Promise.all([
          userAPI.getNearbyTeammates({ sport: user.sport }),
          userAPI.getActiveTeammates(),
        ]);
        setNearbyData(nearbyRes.data);
        setActiveTeammates(activeRes.data.teammates);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user.sport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-indigo-100">
                Ready to find some teammates for {user.sport}?
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center space-x-2">
                <span className="text-2xl">{sportIcons[user.sport]}</span>
                <span className="capitalize font-medium">{user.sport}</span>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                <span>
                  {user.area}, {user.city}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Teammates in Your Area</p>
                <p className="text-3xl font-bold text-gray-900">
                  {nearbyData?.sameArea?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Nearby in {user.city}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {nearbyData?.nearbyAreas?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏙️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Right Now</p>
                <p className="text-3xl font-bold text-gray-900">
                  {activeTeammates.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Teammates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Active Teammates
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Online in last 15 min)
              </span>
            </h2>
            <Link
              to="/discover?activeOnly=true"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All →
            </Link>
          </div>

          {activeTeammates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTeammates.slice(0, 6).map((teammate) => (
                <TeammateCard key={teammate.id} teammate={teammate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-500">
                No active teammates at the moment. Check back later!
              </p>
            </div>
          )}
        </div>

        {/* Teammates in Same Area */}
        {nearbyData?.sameArea?.teammates?.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                In Your Area ({user.area})
              </h2>
              <Link
                to={`/discover?area=${user.area}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyData.sameArea.teammates.slice(0, 3).map((teammate) => (
                <TeammateCard key={teammate.id} teammate={teammate} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Want to explore more?
          </h3>
          <p className="text-gray-600 mb-6">
            Discover teammates from different cities and sports
          </p>
          <Link
            to="/discover"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Explore All Teammates
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
