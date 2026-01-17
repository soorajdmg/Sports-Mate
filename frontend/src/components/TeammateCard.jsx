const sportIcons = {
  football: '⚽',
  cricket: '🏏',
  badminton: '🏸',
  tennis: '🎾',
  basketball: '🏀',
  volleyball: '🏐',
  hockey: '🏑',
  swimming: '🏊',
};

const TeammateCard = ({ teammate }) => {
  const { name, sport, city, area, isOnline, lastActive } = teammate;

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
            {sportIcons[sport] || '🏃'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
            <p className="text-indigo-600 font-medium capitalize">{sport}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`}
          ></span>
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnline ? 'Online' : getTimeAgo(lastActive)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center text-gray-600">
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>
          {area}, {city}
        </span>
      </div>
    </div>
  );
};

export default TeammateCard;
