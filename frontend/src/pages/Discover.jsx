import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userAPI } from '../services/api';
import TeammateCard from '../components/TeammateCard';

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [teammates, setTeammates] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: searchParams.get('sport') || '',
    city: searchParams.get('city') || '',
    area: searchParams.get('area') || '',
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
        if (filters.area) params.area = filters.area;
        if (filters.activeOnly) params.activeOnly = 'true';

        const response = await userAPI.discoverTeammates(params);
        setTeammates(response.data.teammates);
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
    setFilters({ sport: '', city: '', area: '', activeOnly: false });
    setSearchParams({});
  };

  const hasFilters =
    filters.sport || filters.city || filters.area || filters.activeOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Teammates
          </h1>
          <p className="text-gray-600">
            Find sports enthusiasts in your area or explore other cities
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

          <div className="grid md:grid-cols-4 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                placeholder="Enter area..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

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
              <TeammateCard key={teammate.id} teammate={teammate} />
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
