import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { connectionAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children }) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connectionStatuses, setConnectionStatuses] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch all connections
  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const response = await connectionAPI.getConnections();
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Fetch connections error:', error);
    }
  }, [user]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const response = await connectionAPI.getPendingRequests();
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
    }
  }, [user]);

  // Fetch sent requests
  const fetchSentRequests = useCallback(async () => {
    if (!user) return;
    try {
      const response = await connectionAPI.getSentRequests();
      setSentRequests(response.data.requests || []);
    } catch (error) {
      console.error('Fetch sent requests error:', error);
    }
  }, [user]);

  // Fetch all connection data
  const fetchAllConnectionData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([
      fetchConnections(),
      fetchPendingRequests(),
      fetchSentRequests()
    ]);
    setLoading(false);
  }, [user, fetchConnections, fetchPendingRequests, fetchSentRequests]);

  // Get connection status for a specific user
  const getConnectionStatus = useCallback(async (userId) => {
    if (!user || !userId) return null;

    // Check cache first
    if (connectionStatuses.has(userId)) {
      return connectionStatuses.get(userId);
    }

    try {
      const response = await connectionAPI.getConnectionStatus(userId);
      const status = {
        status: response.data.status,
        connectionId: response.data.connectionId,
        isRequester: response.data.isRequester
      };
      setConnectionStatuses(prev => new Map(prev).set(userId, status));
      return status;
    } catch (error) {
      console.error('Get connection status error:', error);
      return null;
    }
  }, [user, connectionStatuses]);

  // Send connection request
  const sendConnectionRequest = useCallback(async (userId) => {
    try {
      const response = await connectionAPI.sendRequest(userId);
      toast.success(response.data.message || 'Connection request sent!');

      // Update cache
      setConnectionStatuses(prev => new Map(prev).set(userId, {
        status: 'pending',
        connectionId: response.data.connection._id,
        isRequester: true
      }));

      // Refresh sent requests
      await fetchSentRequests();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
      return false;
    }
  }, [fetchSentRequests]);

  // Accept connection request
  const acceptConnectionRequest = useCallback(async (connectionId, userId) => {
    try {
      const response = await connectionAPI.acceptRequest(connectionId);
      toast.success(response.data.message || 'Connection accepted!');

      // Update cache
      if (userId) {
        setConnectionStatuses(prev => new Map(prev).set(userId, {
          status: 'accepted',
          connectionId,
          isRequester: false
        }));
      }

      // Refresh data
      await Promise.all([fetchConnections(), fetchPendingRequests()]);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept request');
      return false;
    }
  }, [fetchConnections, fetchPendingRequests]);

  // Reject connection request
  const rejectConnectionRequest = useCallback(async (connectionId, userId) => {
    try {
      await connectionAPI.rejectRequest(connectionId);
      toast.success('Connection request rejected');

      // Update cache
      if (userId) {
        setConnectionStatuses(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }

      // Refresh pending requests
      await fetchPendingRequests();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
      return false;
    }
  }, [fetchPendingRequests]);

  // Cancel sent request
  const cancelConnectionRequest = useCallback(async (connectionId, userId) => {
    try {
      await connectionAPI.cancelRequest(connectionId);
      toast.success('Connection request cancelled');

      // Update cache
      if (userId) {
        setConnectionStatuses(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }

      // Refresh sent requests
      await fetchSentRequests();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
      return false;
    }
  }, [fetchSentRequests]);

  // Remove connection
  const removeConnection = useCallback(async (connectionId, userId) => {
    try {
      await connectionAPI.removeConnection(connectionId);
      toast.success('Connection removed');

      // Update cache
      if (userId) {
        setConnectionStatuses(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }

      // Refresh connections
      await fetchConnections();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove connection');
      return false;
    }
  }, [fetchConnections]);

  // Clear cache for a specific user
  const clearStatusCache = useCallback((userId) => {
    setConnectionStatuses(prev => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (user) {
      fetchAllConnectionData();
    } else {
      setConnections([]);
      setPendingRequests([]);
      setSentRequests([]);
      setConnectionStatuses(new Map());
    }
  }, [user, fetchAllConnectionData]);

  const value = {
    connections,
    pendingRequests,
    sentRequests,
    loading,
    fetchConnections,
    fetchPendingRequests,
    fetchSentRequests,
    fetchAllConnectionData,
    getConnectionStatus,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    cancelConnectionRequest,
    removeConnection,
    clearStatusCache,
    pendingCount: pendingRequests.length
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export default ConnectionContext;
