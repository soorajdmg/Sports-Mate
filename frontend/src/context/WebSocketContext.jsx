import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // Map of recipientId -> senderId
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const messageListeners = useRef(new Set());
  const readReceiptListeners = useRef(new Set());

  // Connect to WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code);
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect with exponential backoff
      if (user && reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [user]);

  // Handle incoming messages
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        console.log('WebSocket authenticated as:', data.userId);
        break;

      case 'message:new':
      case 'message:sent':
        messageListeners.current.forEach(listener => listener(data.message));
        break;

      case 'message:read':
        readReceiptListeners.current.forEach(listener => listener(data));
        break;

      case 'typing:start':
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.set(data.userId, Date.now());
          return next;
        });
        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
        }, 3000);
        break;

      case 'typing:stop':
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
        break;

      case 'user:online':
        setOnlineUsers(prev => new Set([...prev, data.userId]));
        break;

      case 'user:offline':
        setOnlineUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
        break;

      case 'pong':
        // Keep-alive response
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        break;

      default:
        console.log('Unknown WebSocket message:', data);
    }
  }, []);

  // Send a message via WebSocket
  const sendMessage = useCallback((receiverId, content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message:send',
      payload: { receiverId, content }
    }));
    return true;
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((senderId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message:read',
      payload: { senderId }
    }));
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((receiverId, isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: isTyping ? 'typing:start' : 'typing:stop',
      payload: { receiverId }
    }));
  }, []);

  // Subscribe to new messages
  const onMessage = useCallback((callback) => {
    messageListeners.current.add(callback);
    return () => messageListeners.current.delete(callback);
  }, []);

  // Subscribe to read receipts
  const onReadReceipt = useCallback((callback) => {
    readReceiptListeners.current.add(callback);
    return () => readReceiptListeners.current.delete(callback);
  }, []);

  // Check if a user is typing
  const isUserTyping = useCallback((userId) => {
    return typingUsers.has(userId);
  }, [typingUsers]);

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Connect when user logs in
  useEffect(() => {
    if (user) {
      connect();
    } else {
      // Disconnect when user logs out
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, connect]);

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const value = {
    isConnected,
    sendMessage,
    markAsRead,
    sendTyping,
    onMessage,
    onReadReceipt,
    isUserTyping,
    isUserOnline,
    onlineUsers
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
