import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenue } from '../context/VenueContext';
import { useConnection } from '../context/ConnectionContext';

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

const CheckedInPlayers = ({ placeId }) => {
  const navigate = useNavigate();
  const { getVenuePlayers } = useVenue();
  const { sendConnectionRequest } = useConnection();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      const data = await getVenuePlayers(placeId);
      setPlayers(data);
      setLoading(false);
    };

    if (placeId) {
      fetchPlayers();
    }
  }, [placeId, getVenuePlayers]);

  const handleConnect = async (playerId) => {
    const success = await sendConnectionRequest(playerId);
    if (success) {
      // Update local state
      setPlayers(prev =>
        prev.map(p =>
          p.id === playerId
            ? { ...p, connectionStatus: 'pending' }
            : p
        )
      );
    }
  };

  const handleMessage = (playerId) => {
    navigate(`/chat/${playerId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-gray-500">No players checked in here yet</p>
        <p className="text-gray-400 text-sm mt-1">Be the first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Players Here ({players.length})
      </h4>

      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-lg">
              {sportIcons[player.sport] || '🏃'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{player.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    player.isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></span>
              </div>
              <p className="text-xs text-gray-500 capitalize">
                {player.sport} • {player.minutesRemaining}m left
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {player.connectionStatus === 'accepted' ? (
              <button
                onClick={() => handleMessage(player.id)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Message
              </button>
            ) : player.connectionStatus === 'pending' ? (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm rounded-lg">
                Pending
              </span>
            ) : (
              <button
                onClick={() => handleConnect(player.id)}
                className="px-3 py-1.5 bg-indigo-100 text-indigo-600 text-sm rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckedInPlayers;
