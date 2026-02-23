import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/authContext';
import axios from '../api/axios';

function EventDiscussion({ eventId, isOrganizer, organizerId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch message history
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/messages/event/${eventId}`);
        setMessages(response.data.messages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Connect to Socket.io
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat');
      socket.emit('join-event', eventId);
    });

    socket.on('new-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, isDeleted: true } : msg
        )
      );
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    // Cleanup on unmount
    return () => {
      socket.emit('leave-event', eventId);
      socket.disconnect();
    };
  }, [eventId]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    if (newMessage.length > 500) {
      setError('Message must be less than 500 characters');
      return;
    }

    setSending(true);
    setError('');

    const messageData = {
      eventId,
      senderId: user._id || user.id,
      senderType: user.role === 'organizer' ? 'organizer' : 'participant',
      senderName:
        user.role === 'organizer'
          ? user.organizerName
          : `${user.firstName} ${user.lastName}`,
      message: newMessage.trim()
    };

    socketRef.current.emit('send-message', messageData);
    setNewMessage('');
    setSending(false);
  };

  const handleDeleteMessage = (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    socketRef.current.emit('delete-message', {
      messageId,
      deletedBy: user._id || user.id,
      eventId
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if current user is the event organizer
  const canModerate = isOrganizer || (user?._id === organizerId || user?.id === organizerId);

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden',
      marginTop: '30px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'black',
        color: 'white',
        padding: '15px 20px',
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        Event Discussion ({messages.filter(m => !m.isDeleted).length})
      </div>

      {/* Messages Container */}
      <div style={{
        height: '400px',
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
            No messages yet. Be the first to start the discussion!
          </p>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg._id}
                style={{
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: msg.isDeleted ? '#fee' : 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: msg.isDeleted ? 0.6 : 1
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '5px'
                }}>
                  <div>
                    <strong style={{
                      color: msg.senderType === 'organizer' ? '#007bff' : 'black'
                    }}>
                      {msg.senderName}
                      {msg.senderType === 'organizer' && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}>
                          ORGANIZER
                        </span>
                      )}
                    </strong>
                    <span style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {canModerate && !msg.isDeleted && (
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#dc3545',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px 6px'
                      }}
                      title="Delete message"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <p style={{
                  margin: 0,
                  color: msg.isDeleted ? '#999' : 'black',
                  fontStyle: msg.isDeleted ? 'italic' : 'normal'
                }}>
                  {msg.isDeleted ? '[Message deleted by moderator]' : msg.message}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {user ? (
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #ddd',
          backgroundColor: 'white'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '8px 12px',
              borderRadius: '5px',
              marginBottom: '10px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message... (max 500 characters)"
              maxLength={500}
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                backgroundColor: !newMessage.trim() || sending ? '#ccc' : 'black',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>

          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'right'
          }}>
            {newMessage.length}/500
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderTop: '1px solid #ddd',
          color: '#666'
        }}>
          Please log in to participate in the discussion.
        </div>
      )}
    </div>
  );
}

export default EventDiscussion;
