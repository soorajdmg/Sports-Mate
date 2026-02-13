const sportIcons = {
  football: '⚽',
  soccer: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  tennis: '🎾',
  basketball: '🏀',
  volleyball: '🏐',
  hockey: '🏑',
  field_hockey: '🏑',
  swimming: '🏊',
  general: '🏟️'
};

const leisureLabels = {
  sports_centre: 'Sports Centre',
  stadium: 'Stadium',
  pitch: 'Playing Field',
  fitness_centre: 'Fitness Centre',
  swimming_pool: 'Swimming Pool',
  track: 'Track',
};

const VenueCard = ({ venue, compact = false, onSelect }) => {
  const {
    name,
    address,
    playerCount,
    distance,
    sport: venueSport,
    leisure,
    tags
  } = venue;

  const icon = sportIcons[venueSport] || sportIcons[leisure] || sportIcons.general;
  const typeLabel = leisureLabels[leisure] || (venueSport ? venueSport.charAt(0).toUpperCase() + venueSport.slice(1) : 'Venue');

  if (compact) {
    return (
      <div className="p-2 min-w-[200px]">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{name}</h3>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{address}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 capitalize">{typeLabel}</span>
          <div className="flex items-center space-x-2">
            {distance !== undefined && (
              <span className="text-xs text-indigo-600 font-medium">
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance}km`}
              </span>
            )}
            {playerCount > 0 && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                {playerCount} here
              </span>
            )}
          </div>
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
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <p className="text-sm text-gray-500 truncate">{address}</p>
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div className="mt-3 flex items-center flex-wrap gap-2">
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
            {typeLabel}
          </span>
          {tags?.surface && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {tags.surface}
            </span>
          )}
          {tags?.lit === 'yes' && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
              Floodlit
            </span>
          )}
          {tags?.access === 'yes' || tags?.access === 'public' ? (
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
              Public
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {distance !== undefined && (
            <span className="text-sm text-gray-500">
              {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance}km away`}
            </span>
          )}
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
