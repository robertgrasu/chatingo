import React, { useRef, useEffect, useState } from 'react';
import FeedbackCard from '../../components/FeedbackCard';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Acum';
  if (diff < 3600) return `Acum ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `Acum ${Math.floor(diff / 3600)}h`;
  return new Date(ts).toLocaleDateString('ro-RO');
}

function shouldShowTimestamp(prev, curr) {
  if (!prev) return true;
  return (curr.time - prev.time) > 300000;
}

export default function MessageList({ messages, isLoading, color, botName, avatarColor, avatarUrl, userMessageColor, onFeedback, feedbackSubmitted, operatorTyping, onRequestHuman, onDismissEscalation, onContactSubmit, showContactForm, chatMode }) {
  const endRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, operatorTyping]);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const avatarEl = (show) => {
    if (!show) return <div style={{ width: '28px', flexShrink: 0 }} />;
    if (avatarUrl) {
      return (
        <img src={avatarUrl} style={{
          width: '28px', height: '28px', borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }} />
      );
    }
    return (
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: avatarColor || color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="cw-modern-msgs" style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      padding: '20px 16px 12px',
      background: '#f8f9fb',
      overscrollBehavior: 'contain',
    }}>
      {messages.map((msg, i) => {
        if (msg.role === 'feedback') {
          return <FeedbackCard key={i} onSubmit={onFeedback} color={color} submitted={feedbackSubmitted} />;
        }
        if (msg.role === 'system') {
          return (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0', margin: '4px 0' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f0f1f3', borderRadius: '12px', padding: '4px 12px', display: 'inline-block' }}>
                {msg.content}
              </span>
            </div>
          );
        }
        if (msg.role === 'escalation') {
          return (
            <div key={i} style={{ margin: '10px 0', padding: '12px 16px', background: '#ffffff', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '13px', color: '#1f2937', marginBottom: '10px', lineHeight: '1.4' }}>
                Nu am gasit cel mai bun raspuns. Doriti sa vorbiti cu un operator?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={onRequestHuman} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: color, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {msg.operatorsOnline ? 'Da, conecteaza-ma' : 'Lasa un mesaj'}
                </button>
                <button onClick={onDismissEscalation} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '12px', cursor: 'pointer' }}>
                  Nu, multumesc
                </button>
              </div>
            </div>
          );
        }
        const isUser = msg.role === 'user';
        const prev = i > 0 ? messages[i - 1] : null;
        const showTs = shouldShowTimestamp(prev, msg);
        const sameSender = prev && prev.role === msg.role && !showTs;

        return (
          <React.Fragment key={i}>
            {showTs && (
              <div style={{
                textAlign: 'center',
                padding: i === 0 ? '0 0 10px' : '14px 0 10px',
                fontSize: '11px',
                color: '#9ca3af',
                fontWeight: 500,
                letterSpacing: '0.02em',
              }}>
                {timeAgo(msg.time)}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              marginTop: sameSender ? '3px' : '10px',
              gap: '8px',
            }}>
              {!isUser && avatarEl(!sameSender)}

              <div style={{
                maxWidth: '75%',
                padding: '10px 16px',
                borderRadius: isUser
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                background: isUser ? (userMessageColor || color) : '#ffffff',
                color: isUser ? '#ffffff' : '#1f2937',
                fontSize: '14px',
                lineHeight: '1.55',
                boxShadow: isUser
                  ? 'none'
                  : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
                wordBreak: 'break-word',
              }}>
                {msg.image && (
                  <img src={msg.image} alt="" style={{
                    maxWidth: '100%', borderRadius: '10px',
                    marginBottom: msg.content !== '(imagine)' ? '8px' : 0,
                    display: 'block',
                  }} />
                )}
                {msg.content !== '(imagine)' && <div>{msg.content}</div>}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Operator typing indicator */}
      {operatorTyping && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '8px',
          marginTop: '10px',
        }}>
          {avatarEl(true)}
          <div>
            <div style={{
              background: '#ffffff',
              borderRadius: '18px 18px 18px 4px',
              padding: '14px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0, 1, 2].map((idx) => (
                <div key={idx} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: '#b0b4ba',
                  animation: `cwModernBounce 1.4s ${idx * 0.2}s infinite ease-in-out`,
                }} />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              Operator scrie...
            </div>
          </div>
        </div>
      )}

      {/* Bot typing indicator */}
      {isLoading && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '8px',
          marginTop: '10px',
        }}>
          {avatarEl(true)}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px 18px 18px 4px',
            padding: '14px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
            display: 'flex', gap: '5px', alignItems: 'center',
          }}>
            {[0, 1, 2].map((idx) => (
              <div key={idx} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#b0b4ba',
                animation: `cwModernBounce 1.4s ${idx * 0.2}s infinite ease-in-out`,
              }} />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
