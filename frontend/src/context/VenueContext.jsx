import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { venueAPI, checkinAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const VenueContext = createContext(null);

export const VenueProvider = ({ children }) => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [activeCheckin, setActiveCheckin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch user's active check-in on mount
  const fetchActiveCheckin = useCallback(async () => {
    if (!user) return;

    try {
      const response = await checkinAPI.getActive();
      if (response.data.hasActiveCheckin) {
        setActiveCheckin(response.data.checkin);
      } else {
        setActiveCheckin(null);
      }
    } catch (error) {
      console.error('Fetch active check-in error:', error);
    }
  }, [user]);

  // Search nearby venues
  const searchNearbyVenues = useCallback(async (lat, lng, radius = 5000, sport = 'general') => {
    setLoading(true);
    try {
      const response = await venueAPI.searchNearby({ lat, lng, radius, sport });
      setVenues(response.data.venues || []);
      return response.data.venues || [];
    } catch (error) {
      console.error('Search venues error:', error);
      const msg = error.response?.data?.message || 'Failed to search venues. Please try again.';
      toast.error(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get venue details
  const getVenueDetails = useCallback(async (placeId) => {
    try {
      const response = await venueAPI.getDetails(placeId);
      return response.data.venue;
    } catch (error) {
      console.error('Get venue details error:', error);
      const msg = error.response?.data?.message || 'Failed to load venue details. Please try again.';
      toast.error(msg);
      return null;
    }
  }, []);

  // Get players at venue
  const getVenuePlayers = useCallback(async (placeId) => {
    try {
      const response = await venueAPI.getPlayers(placeId);
      return response.data.players || [];
    } catch (error) {
      console.error('Get venue players error:', error);
      return [];
    }
  }, []);

  // Check in to venue
  const checkinToVenue = useCallback(async (venue, sport) => {
    if (activeCheckin) {
      toast.error('You already have an active check-in. Check out first.');
      return false;
    }

    try {
      if (!venue.location?.lat || !venue.location?.lng) {
        toast.error('Venue location data is missing. Cannot check in.');
        return false;
      }

      const response = await checkinAPI.checkin({
        placeId: venue.placeId,
        venueName: venue.name,
        venueAddress: venue.address || 'Unknown address',
        venueLocation: { lat: venue.location.lat, lng: venue.location.lng },
        sport: sport || user?.sport || 'general'
      });

      setActiveCheckin(response.data.checkin);
      toast.success(`Checked in to ${venue.name}`);

      // Update venue player count in local state
      setVenues(prev =>
        prev.map(v =>
          v.placeId === venue.placeId
            ? { ...v, playerCount: (v.playerCount || 0) + 1 }
            : v
        )
      );

      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in');
      return false;
    }
  }, [activeCheckin, user]);

  // Check out
  const checkout = useCallback(async () => {
    if (!activeCheckin) return false;

    try {
      await checkinAPI.checkout(activeCheckin.id);

      // Update venue player count in local state
      setVenues(prev =>
        prev.map(v =>
          v.placeId === activeCheckin.placeId
            ? { ...v, playerCount: Math.max(0, (v.playerCount || 1) - 1) }
            : v
        )
      );

      toast.success('Checked out successfully');
      setActiveCheckin(null);
      return true;
    } catch (error) {
      toast.error('Failed to check out');
      return false;
    }
  }, [activeCheckin]);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fall back to user's profile location if available
          if (user?.latitude && user?.longitude) {
            const location = {
              lat: user.latitude,
              lng: user.longitude
            };
            setUserLocation(location);
            resolve(location);
          } else {
            reject(error);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [user]);

  // Calculate time remaining for active check-in
  const getCheckinTimeRemaining = useCallback(() => {
    if (!activeCheckin) return null;

    const expiresAt = new Date(activeCheckin.expiresAt);
    const now = new Date();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      setActiveCheckin(null);
      return null;
    }

    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return { hours, minutes: mins, totalMinutes: minutes };
  }, [activeCheckin]);

  // Fetch active check-in when user logs in
  useEffect(() => {
    if (user) {
      fetchActiveCheckin();
    } else {
      setActiveCheckin(null);
      setVenues([]);
    }
  }, [user, fetchActiveCheckin]);

  // Set up timer to check for check-in expiry
  useEffect(() => {
    if (!activeCheckin) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(activeCheckin.expiresAt);
      if (new Date() >= expiresAt) {
        setActiveCheckin(null);
        toast('Your check-in has expired');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeCheckin]);

  const value = {
    venues,
    selectedVenue,
    setSelectedVenue,
    activeCheckin,
    loading,
    userLocation,
    searchNearbyVenues,
    getVenueDetails,
    getVenuePlayers,
    checkinToVenue,
    checkout,
    getUserLocation,
    getCheckinTimeRemaining,
    fetchActiveCheckin
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
};

export const useVenue = () => {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
};

export default VenueContext;
