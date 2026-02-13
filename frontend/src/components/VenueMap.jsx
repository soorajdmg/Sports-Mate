import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VenueCard from './VenueCard';

// Fix default marker icons (Leaflet CSS issue with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

// Create a colored circle marker icon
const createVenueIcon = (color, playerCount) => {
  return L.divIcon({
    className: 'custom-venue-marker',
    html: `
      <div style="
        width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
        background: ${color}; transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">
        ${playerCount > 0 ? `<span style="
          transform: rotate(45deg); color: white; font-size: 11px; font-weight: bold;
        ">${playerCount}</span>` : ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: #3b82f6; border: 3px solid white;
      box-shadow: 0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

// Component to handle map view changes
const MapController = ({ userLocation, selectedVenue }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedVenue) {
      map.setView([selectedVenue.location.lat, selectedVenue.location.lng], 16);
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [map, userLocation, selectedVenue]);

  return null;
};

const VenueMap = ({ venues, userLocation, selectedVenue, onVenueSelect, sport }) => {
  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629]; // India center

  const markerColor = sportMarkerColors[sport] || sportMarkerColors.general;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={userLocation ? 14 : 5}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController userLocation={userLocation} selectedVenue={selectedVenue} />

      {/* User location marker */}
      {userLocation && (
        <>
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>Your location</Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={200}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 1
            }}
          />
        </>
      )}

      {/* Venue markers */}
      {venues.map((venue) => (
        <Marker
          key={venue.placeId}
          position={[venue.location.lat, venue.location.lng]}
          icon={createVenueIcon(markerColor, venue.playerCount)}
          eventHandlers={{
            click: () => onVenueSelect?.(venue)
          }}
        >
          <Popup maxWidth={280}>
            <VenueCard venue={venue} compact onSelect={() => onVenueSelect?.(venue)} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default VenueMap;
