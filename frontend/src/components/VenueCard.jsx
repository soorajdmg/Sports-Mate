import { venueAPI } from '../services/api';

const sportIcons = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  tennis: '🎾',
  basketball: '🏀',
  volleyball: '🏐',
  hockey: '🏑',
  swimming: '🏊',
  general: '🏟️'
};

const VenueCard = ({ venue, compact = false, onSelect, showPhoto = false }) => {
  const {
    name,
    address,
    rating,
    totalRatings,
    playerCount,
    isOpen,
    photoReference,
    types
  } = venue;

  // Determine sport type from venue types
  const getSportFromTypes = (types) => {
    if (!types) return 'general';
    const typeStr = types.join(' ').toLowerCase();
    if (typeStr.includes('gym') || typeStr.includes('fitness')) return 'general';
    if (typeStr.includes('swimming') || typeStr.includes('pool')) return 'swimming';
    if (typeStr.includes('stadium')) return 'football';
    return 'general';
  };

  const sport = getSportFromTypes(types);

  const renderStars = (rating) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">
          {rating.toFixed(1)} ({totalRatings})
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="p-2 min-w-[200px]">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">{sportIcons[sport]}</span>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{name}</h3>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{address}</p>
        <div className="flex items-center justify-between">
          {rating && (
            <div className="flex items-center text-xs">
              <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1">{rating.toFixed(1)}</span>
            </div>
          )}
          {playerCount > 0 && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              {playerCount} here
            </span>
          )}
        </div>
        {onSelect && (
          <button
            onClick={onSelect}
            className="mt-2 w-full text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
      {showPhoto && photoReference && (
        <div className="h-40 bg-gray-200">
          <img
            src={venueAPI.getPhotoUrl(photoReference, 400)}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
              {sportIcons[sport]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-gray-500 truncate">{address}</p>
            </div>
          </div>
          {isOpen !== null && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                isOpen
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {rating && renderStars(rating)}
          {playerCount > 0 && (
            <span className="flex items-center bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {playerCount} {playerCount === 1 ? 'player' : 'players'} here
            </span>
          )}
        </div>

        {onSelect && (
          <button
            onClick={onSelect}
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            View Venue
          </button>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
