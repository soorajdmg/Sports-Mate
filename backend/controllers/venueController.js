const Checkin = require('../models/Checkin');
const User = require('../models/User');
const Connection = require('../models/Connection');

// Sport type to Google Places keywords mapping
const sportKeywords = {
  football: ['football ground', 'soccer field', 'football stadium'],
  cricket: ['cricket ground', 'cricket stadium', 'cricket pitch'],
  badminton: ['badminton court', 'badminton hall'],
  tennis: ['tennis court', 'tennis club'],
  basketball: ['basketball court', 'basketball ground'],
  volleyball: ['volleyball court'],
  hockey: ['hockey field', 'hockey ground'],
  swimming: ['swimming pool', 'aquatic center'],
  general: ['sports complex', 'stadium', 'gym', 'fitness center']
};

// Google Places API types for sports venues
const placeTypes = ['gym', 'stadium', 'park'];

// In-memory cache for venue searches (simple implementation)
const venueCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// @desc    Search nearby venues
// @route   GET /api/venues/nearby
// @access  Private
const searchNearbyVenues = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, sport = 'general' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const cacheKey = `${lat}-${lng}-${radius}-${sport}`;
    const cached = venueCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({
        success: true,
        venues: cached.data,
        fromCache: true
      });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Places API key not configured'
      });
    }

    // Get keywords for the sport
    const keywords = sportKeywords[sport] || sportKeywords.general;
    const keyword = keywords[0]; // Use primary keyword

    // Call Google Places Nearby Search API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API Error:', data.status, data.error_message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch venues from Google Places'
      });
    }

    const venues = (data.results || []).map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      types: place.types,
      isOpen: place.opening_hours?.open_now ?? null,
      photoReference: place.photos?.[0]?.photo_reference || null
    }));

    // Get check-in counts for each venue
    const venuesWithCounts = await Promise.all(
      venues.map(async (venue) => {
        const checkins = await Checkin.find({
          placeId: venue.placeId,
          status: 'active',
          expiresAt: { $gt: new Date() }
        });
        return {
          ...venue,
          playerCount: checkins.length
        };
      })
    );

    // Cache the results
    venueCache.set(cacheKey, {
      data: venuesWithCounts,
      timestamp: Date.now()
    });

    res.status(200).json({
      success: true,
      count: venuesWithCounts.length,
      venues: venuesWithCounts
    });
  } catch (error) {
    console.error('Search Nearby Venues Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search venues'
    });
  }
};

// @desc    Get venue details
// @route   GET /api/venues/:placeId
// @access  Private
const getVenueDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Places API key not configured'
      });
    }

    // Call Google Places Details API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,types&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const place = data.result;
    const venue = {
      placeId,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      types: place.types,
      openingHours: place.opening_hours?.weekday_text || null,
      isOpen: place.opening_hours?.open_now ?? null,
      photos: (place.photos || []).slice(0, 5).map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      }))
    };

    // Get check-in count
    const checkins = await Checkin.find({
      placeId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    venue.playerCount = checkins.length;

    res.status(200).json({
      success: true,
      venue
    });
  } catch (error) {
    console.error('Get Venue Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get venue details'
    });
  }
};

// @desc    Get players checked in at a venue
// @route   GET /api/venues/:placeId/players
// @access  Private
const getVenuePlayers = async (req, res) => {
  try {
    const { placeId } = req.params;
    const currentUserId = req.user._id;

    const checkins = await Checkin.getVenueCheckins(placeId);

    // Get connection status for each player
    const playersWithStatus = await Promise.all(
      checkins.map(async (checkin) => {
        const userId = checkin.user._id;

        // Skip current user
        if (userId.toString() === currentUserId.toString()) {
          return null;
        }

        // Get connection status
        const connectionStatus = await Connection.getConnectionStatus(currentUserId, userId);

        // Calculate time remaining
        const timeRemaining = Math.max(0, checkin.expiresAt - new Date());
        const minutesRemaining = Math.floor(timeRemaining / 60000);

        return {
          id: userId,
          name: checkin.user.name,
          sport: checkin.user.sport,
          city: checkin.user.city,
          area: checkin.user.area,
          isOnline: User.isUserActive(checkin.user.lastActive),
          lastActive: checkin.user.lastActive,
          checkedInAt: checkin.createdAt,
          minutesRemaining,
          connectionStatus: connectionStatus.status,
          connectionId: connectionStatus.connection?._id || null
        };
      })
    );

    // Filter out null values (current user)
    const players = playersWithStatus.filter(p => p !== null);

    res.status(200).json({
      success: true,
      count: players.length,
      players
    });
  } catch (error) {
    console.error('Get Venue Players Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get venue players'
    });
  }
};

// @desc    Get photo URL for a venue
// @route   GET /api/venues/photo/:photoReference
// @access  Private
const getVenuePhoto = async (req, res) => {
  try {
    const { photoReference } = req.params;
    const { maxWidth = 400 } = req.query;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Places API key not configured'
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;

    // Redirect to the photo URL
    res.redirect(url);
  } catch (error) {
    console.error('Get Venue Photo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get venue photo'
    });
  }
};

module.exports = {
  searchNearbyVenues,
  getVenueDetails,
  getVenuePlayers,
  getVenuePhoto
};
