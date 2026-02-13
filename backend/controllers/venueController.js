const Checkin = require('../models/Checkin');
const User = require('../models/User');
const Connection = require('../models/Connection');

// Sport type to Overpass API query tags mapping
// Each entry is { key, value, regex } — regex uses ~"value" syntax in Overpass QL
const sportOverpassTags = {
  football: [
    { key: 'sport', value: 'soccer' },
    { key: 'sport', value: 'football' },
    { key: 'sport', value: 'soccer|football', regex: true }
  ],
  cricket: [{ key: 'sport', value: 'cricket' }],
  badminton: [{ key: 'sport', value: 'badminton' }],
  tennis: [{ key: 'sport', value: 'tennis' }],
  basketball: [{ key: 'sport', value: 'basketball' }],
  volleyball: [{ key: 'sport', value: 'volleyball' }],
  hockey: [
    { key: 'sport', value: 'hockey' },
    { key: 'sport', value: 'field_hockey' }
  ],
  swimming: [
    { key: 'leisure', value: 'swimming_pool' },
    { key: 'sport', value: 'swimming' }
  ],
  general: [
    { key: 'leisure', value: 'sports_centre' },
    { key: 'leisure', value: 'stadium' },
    { key: 'leisure', value: 'pitch' },
    { key: 'leisure', value: 'fitness_centre' }
  ]
};

// In-memory cache for venue searches
const venueCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Build Overpass query for sport venues
const buildOverpassQuery = (lat, lng, radiusMeters, sport) => {
  const tags = sportOverpassTags[sport] || sportOverpassTags.general;
  const around = `(around:${radiusMeters},${lat},${lng})`;

  // Build union of queries for each tag
  let queries = '';

  tags.forEach(tag => {
    const filter = tag.regex
      ? `["${tag.key}"~"${tag.value}"]`
      : `["${tag.key}"="${tag.value}"]`;
    queries += `  node${filter}${around};\n`;
    queries += `  way${filter}${around};\n`;
  });

  // Also search for pitches tagged with the specific sport
  if (sport !== 'general') {
    const sportName = sport === 'football' ? 'soccer' : sport;
    queries += `  node["leisure"="pitch"]["sport"="${sportName}"]${around};\n`;
    queries += `  way["leisure"="pitch"]["sport"="${sportName}"]${around};\n`;
  }

  return `[out:json][timeout:25];\n(\n${queries});\nout center tags;`;
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Search nearby venues using Overpass API (OpenStreetMap)
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

    const cacheKey = `${parseFloat(lat).toFixed(3)}-${parseFloat(lng).toFixed(3)}-${radius}-${sport}`;
    const cached = venueCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({
        success: true,
        venues: cached.data,
        fromCache: true
      });
    }

    const query = buildOverpassQuery(lat, lng, radius, sport);

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Overpass API Error:', response.status, errorBody);
      return res.status(502).json({
        success: false,
        message: 'Venue search service is temporarily unavailable. Please try again.'
      });
    }

    const data = await response.json();

    // Parse OSM elements into venue objects
    const venues = (data.elements || [])
      .map(element => {
        const venueLat = element.lat || element.center?.lat;
        const venueLng = element.lon || element.center?.lon;

        if (!venueLat || !venueLng) return null;

        const tags = element.tags || {};
        const name = tags.name || tags['name:en'] || tags.sport || 'Sports Venue';

        // Build address from OSM tags
        const addressParts = [
          tags['addr:street'],
          tags['addr:city'] || tags['addr:suburb'],
          tags['addr:state']
        ].filter(Boolean);
        const address = addressParts.length > 0
          ? addressParts.join(', ')
          : `${venueLat.toFixed(4)}, ${venueLng.toFixed(4)}`;

        const distance = calculateDistance(
          parseFloat(lat), parseFloat(lng),
          venueLat, venueLng
        );

        return {
          placeId: `osm-${element.type}-${element.id}`,
          osmId: element.id,
          osmType: element.type,
          name,
          address,
          location: { lat: venueLat, lng: venueLng },
          sport: tags.sport || null,
          surface: tags.surface || null,
          leisure: tags.leisure || null,
          distance: Math.round(distance * 10) / 10,
          tags: {
            sport: tags.sport,
            leisure: tags.leisure,
            surface: tags.surface,
            access: tags.access,
            lit: tags.lit,
            opening_hours: tags.opening_hours
          }
        };
      })
      .filter(v => v !== null)
      .sort((a, b) => a.distance - b.distance);

    // Deduplicate by name + proximity (within 50m)
    const deduped = [];
    venues.forEach(venue => {
      const isDuplicate = deduped.some(
        existing =>
          existing.name === venue.name &&
          calculateDistance(
            existing.location.lat, existing.location.lng,
            venue.location.lat, venue.location.lng
          ) < 0.05
      );
      if (!isDuplicate) deduped.push(venue);
    });

    // Get check-in counts for each venue
    const venuesWithCounts = await Promise.all(
      deduped.map(async (venue) => {
        const checkins = await Checkin.find({
          placeId: venue.placeId,
          status: 'active',
          expiresAt: { $gt: new Date() }
        });
        return { ...venue, playerCount: checkins.length };
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

// @desc    Get venue details (from cache or Overpass)
// @route   GET /api/venues/:placeId
// @access  Private
const getVenueDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    // Try to find venue in cache
    for (const [, cached] of venueCache) {
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        const found = cached.data.find(v => v.placeId === placeId);
        if (found) {
          // Get latest check-in count
          const checkins = await Checkin.find({
            placeId,
            status: 'active',
            expiresAt: { $gt: new Date() }
          });

          return res.status(200).json({
            success: true,
            venue: { ...found, playerCount: checkins.length }
          });
        }
      }
    }

    // If not in cache, try to fetch from Overpass by OSM ID
    const match = placeId.match(/^osm-(node|way)-(\d+)$/);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const [, osmType, osmId] = match;
    const query = `[out:json][timeout:10];${osmType}(${osmId});out center tags;`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch venue details'
      });
    }

    const data = await response.json();
    const element = data.elements?.[0];

    if (!element) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }

    const tags = element.tags || {};
    const venueLat = element.lat || element.center?.lat;
    const venueLng = element.lon || element.center?.lon;

    const addressParts = [
      tags['addr:street'],
      tags['addr:city'] || tags['addr:suburb'],
      tags['addr:state']
    ].filter(Boolean);

    const venue = {
      placeId,
      name: tags.name || tags['name:en'] || tags.sport || 'Sports Venue',
      address: addressParts.length > 0 ? addressParts.join(', ') : `${venueLat?.toFixed(4)}, ${venueLng?.toFixed(4)}`,
      location: { lat: venueLat, lng: venueLng },
      sport: tags.sport || null,
      surface: tags.surface || null,
      leisure: tags.leisure || null,
      tags: {
        sport: tags.sport,
        leisure: tags.leisure,
        surface: tags.surface,
        access: tags.access,
        lit: tags.lit,
        opening_hours: tags.opening_hours
      }
    };

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

    const playersWithStatus = await Promise.all(
      checkins.map(async (checkin) => {
        const userId = checkin.user._id;

        if (userId.toString() === currentUserId.toString()) {
          return null;
        }

        const connectionStatus = await Connection.getConnectionStatus(currentUserId, userId);
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

module.exports = {
  searchNearbyVenues,
  getVenueDetails,
  getVenuePlayers
};
