import { useState, useEffect, useCallback } from 'react';
import { useVenue } from '../context/VenueContext';
import { useAuth } from '../context/AuthContext';
import VenueMap from '../components/VenueMap';
import VenueCard from '../components/VenueCard';
import CheckinButton from '../components/CheckinButton';
import CheckedInPlayers from '../components/CheckedInPlayers';
import toast from 'react-hot-toast';

const sports = [
  { value: 'general', label: 'All Sports', icon: '🏟️' },
  { value: 'football', label: 'Football', icon: '⚽' },
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'badminton', label: 'Badminton', icon: '🏸' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
];

const Venues = () => {
  const { user } = useAuth();
  const {
    venues,
    selectedVenue,
    setSelectedVenue,
    activeCheckin,
    loading,
    userLocation,
    searchNearbyVenues,
    getVenueDetails,
    getUserLocation
  } = useVenue();

  const [selectedSport, setSelectedSport] = useState('general');
  const [radius, setRadius] = useState(5000); // meters
  const [venueDetails, setVenueDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Get user location and search venues on mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const location = await getUserLocation();
        await searchNearbyVenues(location.lat, location.lng, radius, selectedSport);
        setLocationError(null);
      } catch (error) {
        setLocationError('Unable to get your location. Please enable location services.');
        toast.error('Please enable location access to find nearby venues');
      }
    };

    initializeLocation();
  }, []);

  // Search when filters change
  const handleSearch = useCallback(async () => {
    if (!userLocation) {
      toast.error('Location not available');
      return;
    }
    await searchNearbyVenues(userLocation.lat, userLocation.lng, radius, selectedSport);
  }, [userLocation, radius, selectedSport, searchNearbyVenues]);

  useEffect(() => {
    if (userLocation) {
      handleSearch();
    }
  }, [selectedSport, radius]);

  // Load venue details when selected
  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedVenue) {
        setVenueDetails(null);
        return;
      }

      setLoadingDetails(true);
      const details = await getVenueDetails(selectedVenue.placeId);
      setVenueDetails(details);
      setLoadingDetails(false);
    };

    loadDetails();
  }, [selectedVenue, getVenueDetails]);

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setSelectedVenue(null);
    setVenueDetails(null);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header with filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          {/* Active check-in banner */}
          {activeCheckin && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700">
                  Checked in at <strong>{activeCheckin.venueName}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Sport filter tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {sports.map((sport) => (
              <button
                key={sport.value}
                onClick={() => setSelectedSport(sport.value)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSport === sport.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>

          {/* Distance slider */}
          <div className="mt-3 flex items-center space-x-4">
            <label className="text-sm text-gray-600">Distance:</label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1 max-w-xs"
            />
            <span className="text-sm font-medium text-gray-700 w-16">
              {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative">
        {/* Map */}
        <div className="flex-1">
          {locationError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Location Required</h3>
                <p className="text-gray-500 mb-4">{locationError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <VenueMap
              venues={venues}
              userLocation={userLocation}
              selectedVenue={selectedVenue}
              onVenueSelect={handleVenueSelect}
              sport={selectedSport}
            />
          )}
        </div>

        {/* Sidebar toggle for mobile */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="absolute bottom-4 left-4 z-10 lg:hidden bg-white shadow-lg rounded-full p-3"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`absolute lg:relative right-0 top-0 h-full w-full lg:w-96 bg-white shadow-lg z-20 transform transition-transform ${
            showSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-full overflow-y-auto">
            {/* Venue details view */}
            {selectedVenue ? (
              <div className="p-4">
                <button
                  onClick={handleCloseSidebar}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to list
                </button>

                {loadingDetails ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : venueDetails ? (
                  <div className="space-y-4">
                    <VenueCard venue={venueDetails} />

                    <CheckinButton
                      venue={venueDetails}
                      sport={user?.sport || selectedSport}
                    />

                    {venueDetails.tags?.opening_hours && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Opening Hours</h4>
                        <p className="text-sm text-gray-600">{venueDetails.tags.opening_hours}</p>
                      </div>
                    )}

                    <CheckedInPlayers placeId={selectedVenue.placeId} />
                  </div>
                ) : (
                  <VenueCard venue={selectedVenue} />
                )}
              </div>
            ) : (
              /* Venue list view */
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Nearby Venues ({venues.length})
                  </h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : venues.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500">No venues found nearby</p>
                    <p className="text-gray-400 text-sm mt-1">Try increasing the search radius</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {venues.map((venue) => (
                      <VenueCard
                        key={venue.placeId}
                        venue={venue}
                        onSelect={() => handleVenueSelect(venue)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Venues;
