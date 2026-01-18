import { useState } from 'react';
import toast from 'react-hot-toast';

const LocationPicker = ({ city, area, latitude, longitude, onLocationChange, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          // Use reverse geocoding to get city and area
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }

          const data = await response.json();
          const address = data.address || {};

          // Extract city (try multiple fields)
          const detectedCity =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            '';

          // Extract area/neighborhood
          const detectedArea =
            address.suburb ||
            address.neighbourhood ||
            address.district ||
            address.locality ||
            address.quarter ||
            '';

          onLocationChange({
            city: detectedCity,
            area: detectedArea,
            latitude: lat,
            longitude: lng,
          });

          toast.success('Location detected successfully!');
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still update coordinates even if geocoding fails
          onLocationChange({
            city: city,
            area: area,
            latitude: lat,
            longitude: lng,
          });
          toast.error('Could not detect address. Please enter manually.');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please enable it in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('Failed to get location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading || disabled}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Detecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Detect Location
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => onLocationChange({ city: e.target.value, area, latitude, longitude })}
            required
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Mumbai"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => onLocationChange({ city, area: e.target.value, latitude, longitude })}
            required
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            placeholder="Andheri"
          />
        </div>
      </div>

      {latitude && longitude && (
        <p className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          GPS coordinates saved
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
