import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const TeammateCard = ({ teammate, showDistance = false, showConnectButton = true }) => {
  const { name, sport, city, area, isOnline, lastActive, distance, id } = teammate;
  const navigate = useNavigate();
  const { getConnectionStatus, sendConnectionRequest, cancelConnectionRequest } = useConnection();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showConnectButton && id) {
      getConnectionStatus(id).then(status => {
        setConnectionStatus(status);
      });
    }
  }, [id, showConnectButton, getConnectionStatus]);

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

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const success = await sendConnectionRequest(id);
    if (success) {
      setConnectionStatus({ status: 'pending', isRequester: true });
    }
    setLoading(false);
  };

  const handleCancelRequest = async (e) => {
    e.stopPropagation();
    if (loading || !connectionStatus?.connectionId) return;

    setLoading(true);
    const success = await cancelConnectionRequest(connectionStatus.connectionId, id);
    if (success) {
      setConnectionStatus(null);
    }
    setLoading(false);
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    navigate(`/chat/${id}`);
  };

  const renderConnectionButton = () => {
    if (!showConnectButton) return null;

    const status = connectionStatus?.status;

    if (status === 'accepted') {
      return (
        <button
          onClick={handleMessage}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Message</span>
        </button>
      );
    }

    if (status === 'pending') {
      if (connectionStatus?.isRequester) {
        return (
          <button
            onClick={handleCancelRequest}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Pending'}
          </button>
        );
      }
      return (
        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
          Awaiting
        </span>
      );
    }

    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <span>{loading ? 'Sending...' : 'Connect'}</span>
      </button>
    );
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

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center text-gray-600">
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
        <div className="flex items-center space-x-2">
          {showDistance && distance !== undefined && distance !== null && (
            <span className="text-sm bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium">
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </span>
          )}
          {renderConnectionButton()}
        </div>
      </div>
    </div>
  );
};

export default TeammateCard;
