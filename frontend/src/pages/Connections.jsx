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

const Connections = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('connections');
  const {
    connections,
    pendingRequests,
    sentRequests,
    loading,
    fetchAllConnectionData,
    acceptConnectionRequest,
    rejectConnectionRequest,
    cancelConnectionRequest,
    removeConnection
  } = useConnection();

  useEffect(() => {
    fetchAllConnectionData();
  }, [fetchAllConnectionData]);

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

  const ConnectionCard = ({ user, connectionId, type, createdAt }) => {
    const [actionLoading, setActionLoading] = useState(false);

    const handleAccept = async () => {
      setActionLoading(true);
      await acceptConnectionRequest(connectionId, user.id);
      setActionLoading(false);
    };

    const handleReject = async () => {
      setActionLoading(true);
      await rejectConnectionRequest(connectionId, user.id);
      setActionLoading(false);
    };

    const handleCancel = async () => {
      setActionLoading(true);
      await cancelConnectionRequest(connectionId, user.id);
      setActionLoading(false);
    };

    const handleRemove = async () => {
      if (window.confirm('Are you sure you want to remove this connection?')) {
        setActionLoading(true);
        await removeConnection(connectionId, user.id);
        setActionLoading(false);
      }
    };

    const handleMessage = () => {
      navigate(`/chat/${user.id}`);
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-xl">
              {sportIcons[user.sport] || '🏃'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{user.sport} • {user.area}, {user.city}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></span>
            <span className={`text-xs ${user.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
              {user.isOnline ? 'Online' : getTimeAgo(user.lastActive)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {type === 'connection' ? 'Connected' : type === 'pending' ? 'Received' : 'Sent'} {getTimeAgo(createdAt)}
          </span>
          <div className="flex items-center space-x-2">
            {type === 'connection' && (
              <>
                <button
                  onClick={handleMessage}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Message
                </button>
                <button
                  onClick={handleRemove}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </>
            )}
            {type === 'pending' && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
            {type === 'sent' && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'connections', label: 'My Connections', count: connections.length },
    { id: 'pending', label: 'Pending', count: pendingRequests.length },
    { id: 'sent', label: 'Sent', count: sentRequests.length },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (activeTab === 'connections') {
      if (connections.length === 0) {
        return (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No connections yet</h3>
            <p className="text-gray-500 mb-4">Start connecting with teammates from the Discover page</p>
            <button
              onClick={() => navigate('/discover')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Find Teammates
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {connections.map(conn => (
            <ConnectionCard
              key={conn.connectionId}
              user={conn.user}
              connectionId={conn.connectionId}
              type="connection"
              createdAt={conn.connectedAt}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'pending') {
      if (pendingRequests.length === 0) {
        return (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No pending requests</h3>
            <p className="text-gray-500">Connection requests you receive will appear here</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {pendingRequests.map(req => (
            <ConnectionCard
              key={req.connectionId}
              user={req.user}
              connectionId={req.connectionId}
              type="pending"
              createdAt={req.createdAt}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'sent') {
      if (sentRequests.length === 0) {
        return (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No sent requests</h3>
            <p className="text-gray-500">Requests you send will appear here until accepted</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {sentRequests.map(req => (
            <ConnectionCard
              key={req.connectionId}
              user={req.user}
              connectionId={req.connectionId}
              type="sent"
              createdAt={req.createdAt}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-600 mt-2">Manage your sports network</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Connections;
