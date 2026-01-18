import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userAPI } from '../services/api';
import TeammateCard from '../components/TeammateCard';

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teammates, setTeammates] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userHasLocation, setUserHasLocation] = useState(false);
  const [filters, setFilters] = useState({
    sport: searchParams.get('sport') || '',
    city: searchParams.get('city') || '',
    name: searchParams.get('name') || '',
    maxDistance: searchParams.get('maxDistance') || '',
    activeOnly: searchParams.get('activeOnly') === 'true',
  });

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await userAPI.getSports();
        setSports(response.data.sports);
      } catch (error) {
        console.error('Failed to fetch sports');
      }
    };
    fetchSports();
  }, []);

  useEffect(() => {
    const fetchTeammates = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.sport) params.sport = filters.sport;
        if (filters.city) params.city = filters.city;
        if (filters.name) params.name = filters.name;
        if (filters.maxDistance) params.maxDistance = filters.maxDistance;
        if (filters.activeOnly) params.activeOnly = 'true';

        const response = await userAPI.discoverTeammates(params);
        setTeammates(response.data.teammates);
        setUserHasLocation(response.data.userHasLocation);
      } catch (error) {
        console.error('Failed to fetch teammates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeammates();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v.toString());
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({ sport: '', city: '', name: '', maxDistance: '', activeOnly: false });
    setSearchParams({});
  };

  const hasFilters =
    filters.sport || filters.city || filters.name || filters.maxDistance || filters.activeOnly;

  // Distance options for the slider
  const distanceMarks = [5, 10, 25, 50, 100];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Teammates
          </h1>
          <p className="text-gray-600">
            Find sports enthusiasts near you or explore other cities
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Filters</h2>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={(e) => handleFilterChange('sport', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Sports</option>
                {sports.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Active Only */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.activeOnly}
                  onChange={(e) =>
                    handleFilterChange('activeOnly', e.target.checked)
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">Active Only</span>
                <span className="text-green-500">🟢</span>
              </label>
            </div>
          </div>

          {/* Distance Filter */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Maximum Distance
              </label>
              {!userHasLocation && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Update your location in Profile to enable
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={filters.maxDistance || 0}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFilterChange('maxDistance', val === '0' ? '' : val);
                }}
                disabled={!userHasLocation}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="w-24 text-center">
                {filters.maxDistance ? (
                  <span className="font-semibold text-indigo-600">
                    {filters.maxDistance} km
                  </span>
                ) : (
                  <span className="text-gray-400">Any</span>
                )}
              </div>
            </div>

            {/* Distance markers */}
            <div className="flex justify-between mt-1 px-1">
              {distanceMarks.map((mark) => (
                <button
                  key={mark}
                  onClick={() => handleFilterChange('maxDistance', mark.toString())}
                  disabled={!userHasLocation}
                  className={`text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    filters.maxDistance === mark.toString()
                      ? 'text-indigo-600 font-medium'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {mark}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Found ${teammates.length} teammates`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : teammates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teammates.map((teammate) => (
              <TeammateCard key={teammate.id} teammate={teammate} showDistance={userHasLocation} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No teammates found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters to find more teammates
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
