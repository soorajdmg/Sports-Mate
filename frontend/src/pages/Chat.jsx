import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { messageAPI, connectionAPI } from '../services/api';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import toast from 'react-hot-toast';

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

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendMessage, markAsRead, sendTyping, onMessage, onReadReceipt, isUserTyping, isUserOnline } = useWebSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (pageNum = 1, prepend = false) => {
    try {
      const response = await messageAPI.getMessages(userId, { page: pageNum, limit: 50 });
      const { messages: newMessages, otherUser: userData } = response.data;

      if (pageNum === 1) {
        setMessages(newMessages);
        setOtherUser(userData);
        setTimeout(() => scrollToBottom(false), 100);
      } else {
        if (newMessages.length === 0) {
          setHasMore(false);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You must be connected to chat with this user');
        navigate('/connections');
      } else {
        toast.error('Failed to load messages');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId, navigate, scrollToBottom]);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await connectionAPI.getConnectionStatus(userId);
        if (response.data.status !== 'accepted') {
          toast.error('You must be connected to chat with this user');
          navigate('/connections');
        } else {
          fetchMessages();
        }
      } catch (error) {
        toast.error('Failed to verify connection');
        navigate('/connections');
      }
    };

    if (userId && user) {
      checkConnection();
    }
  }, [userId, user, navigate, fetchMessages]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      // Only add messages from/to this conversation
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();

        // Mark as read if from other user
        if (!message.isOwn) {
          markAsRead(userId);
        }
      }
    });

    return unsubscribe;
  }, [userId, onMessage, markAsRead, scrollToBottom]);

  // Listen for read receipts
  useEffect(() => {
    const unsubscribe = onReadReceipt((data) => {
      if (data.readerId === userId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.isOwn && !msg.isRead
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      }
    });

    return unsubscribe;
  }, [userId, onReadReceipt]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(userId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(userId, false);
    }, 2000);
  }, [userId, sendTyping]);

  // Handle send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(userId, false);
    }

    // Try WebSocket first
    const sent = sendMessage(userId, content);

    if (!sent) {
      // Fallback to REST API
      try {
        const response = await messageAPI.sendMessage(userId, content);
        setMessages(prev => [...prev, response.data.message]);
        scrollToBottom();
      } catch (error) {
        toast.error('Failed to send message');
        setNewMessage(content); // Restore message on failure
      }
    }

    setSending(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Load more messages on scroll
  const handleScroll = () => {
    if (!messagesContainerRef.current || loadingMore || !hasMore) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 100) {
      setLoadingMore(true);
      setPage(prev => {
        const nextPage = prev + 1;
        fetchMessages(nextPage, true);
        return nextPage;
      });
    }
  };

  // Get time ago for last active
  const getTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msgDate });
      }
      groups.push({ type: 'message', data: msg });
    });

    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isOnline = isUserOnline(userId);
  const isTyping = isUserTyping(userId);
  const groupedMessages = groupMessagesByDate(messages);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-lg">
            {sportIcons[otherUser?.sport] || '🏃'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{otherUser?.name}</h2>
            <div className="flex items-center space-x-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`}
              ></span>
              <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : `Last seen ${getTimeAgo(otherUser?.lastActive)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Say hi to {otherUser?.name}!</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${item.date}`} className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                      {formatDateHeader(item.date)}
                    </span>
                  </div>
                );
              }
              return (
                <MessageBubble key={item.data.id || index} message={item.data} />
              );
            })}
          </>
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
