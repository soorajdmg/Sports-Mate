import { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useVenue } from '../context/VenueContext';
import VenueCard from './VenueCard';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629 // India center
};

const sportMarkerColors = {
  football: '#22c55e',
  cricket: '#eab308',
  badminton: '#3b82f6',
  tennis: '#f97316',
  basketball: '#ef4444',
  volleyball: '#8b5cf6',
  hockey: '#06b6d4',
  swimming: '#0ea5e9',
  general: '#6366f1'
};

const VenueMap = ({ venues, userLocation, selectedVenue, onVenueSelect, sport }) => {
  const [map, setMap] = useState(null);
  const [infoWindowVenue, setInfoWindowVenue] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Center map on user location when it changes
  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(14);
    }
  }, [map, userLocation]);

  // Center on selected venue
  useEffect(() => {
    if (map && selectedVenue) {
      map.panTo(selectedVenue.location);
      map.setZoom(16);
      setInfoWindowVenue(selectedVenue);
    }
  }, [map, selectedVenue]);

  const handleMarkerClick = (venue) => {
    setInfoWindowVenue(venue);
    onVenueSelect?.(venue);
  };

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load map</p>
          <p className="text-gray-500 text-sm">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={userLocation ? 14 : 5}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }}
          title="Your location"
        />
      )}

      {/* Venue markers */}
      {venues.map((venue) => (
        <Marker
          key={venue.placeId}
          position={venue.location}
          onClick={() => handleMarkerClick(venue)}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: sportMarkerColors[sport] || sportMarkerColors.general,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 24)
          }}
          label={
            venue.playerCount > 0
              ? {
                  text: venue.playerCount.toString(),
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }
              : undefined
          }
        />
      ))}

      {/* Info window */}
      {infoWindowVenue && (
        <InfoWindow
          position={infoWindowVenue.location}
          onCloseClick={() => setInfoWindowVenue(null)}
          options={{ maxWidth: 320 }}
        >
          <VenueCard
            venue={infoWindowVenue}
            compact
            onSelect={() => onVenueSelect?.(infoWindowVenue)}
          />
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default VenueMap;
