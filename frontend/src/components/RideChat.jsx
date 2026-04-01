import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../hooks/useWebSocket';

export default function RideChat({ rideId, isOpen, onClose, driverName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !rideId) return;

    socket.on('chat_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      if (!isOpen) setUnread(u => u + 1);
    });

    return () => socket.off('chat_message');
  }, [rideId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('chat_message', {
      rideId,
      message: input.trim(),
      senderName: user?.name || 'You',
      senderId: user?._id || user?.id
    });
    setInput('');
  };

  const myId = String(user?._id || user?.id);

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="chat-fab"
        onClick={onClose}
        style={{ position: 'relative' }}
        title="Chat with driver/passengers"
      >
        💬
        {unread > 0 && (
          <span className="chat-unread-badge">{unread}</span>
        )}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div style={{
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>💬</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Ride Chat</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  {driverName ? `Chatting in ride with ${driverName}` : 'Ride group chat'}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--muted)'
            }}>×</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 30 }}>
                <p>No messages yet.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Say hi to your driver or passengers!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = String(msg.senderId) === myId;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {!isMine && (
                      <span style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, paddingLeft: 4 }}>
                        {msg.senderName}
                      </span>
                    )}
                    <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, paddingLeft: 4, paddingRight: 4 }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border)', background: 'var(--input-bg)',
                fontSize: 13, outline: 'none'
              }}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              style={{
                padding: '10px 18px', background: 'var(--coral)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, opacity: input.trim() ? 1 : 0.5,
                transition: 'opacity 0.2s'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
