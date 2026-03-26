import React, { useEffect, useRef, useState } from 'react';
import FeedbackCard from './FeedbackCard';

/* Relative time in Romanian */
function timeAgo(ts) {
  if (!ts) return 'Chiar acum';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'Chiar acum';
  if (diff < 60) return `Acum ${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins === 1) return 'Acum 1 minut';
  if (mins < 60) return `Acum ${mins} minute`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return 'Acum 1 oră';
  if (hrs < 24) return `Acum ${hrs} ore`;
  return 'Ieri';
}

/* Inline formatting: **bold** and *italic* */
function inlineFmt(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(React.createElement('strong', { key: `b${m.index}`, style: { fontWeight: 600 } }, m[2]));
    else if (m[3]) parts.push(React.createElement('em', { key: `i${m.index}` }, m[3]));
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

/* Parse markdown-like text into React elements */
function renderText(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      React.createElement(Tag, {
        key: `l-${elements.length}`,
        style: { margin: '6px 0 6px 0', paddingLeft: '20px', listStyleType: listType === 'ol' ? 'decimal' : 'disc' },
      }, listItems.map((item, j) =>
        React.createElement('li', { key: j, style: { marginBottom: '3px' } }, inlineFmt(item))
      ))
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line, i) => {
    const t = line.trim();
    const olM = t.match(/^\d+[.)]\s+(.+)/);
    if (olM) { if (listType !== 'ol') flushList(); listType = 'ol'; listItems.push(olM[1]); return; }
    const ulM = t.match(/^[-*]\s+(.+)/);
    if (ulM) { if (listType !== 'ul') flushList(); listType = 'ul'; listItems.push(ulM[1]); return; }
    flushList();
    if (t === '') {
      elements.push(React.createElement('div', { key: `s-${i}`, style: { height: '8px' } }));
    } else {
      elements.push(React.createElement('div', { key: `p-${i}`, style: { marginBottom: '2px' } }, inlineFmt(t)));
    }
  });
  flushList();
  return elements;
}

function ContactFormInline({ onSubmit, color }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    onSubmit({ name: name.trim(), email: email.trim(), message: message.trim() });
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', margin: '8px 0' }}>
        <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
          Formularul a fost trimis!
        </span>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <form onSubmit={handleSubmit} style={{
      margin: '8px 0', padding: '14px',
      background: '#f8f9fa', borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
        Niciun operator disponibil. Lasati un mesaj:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text" placeholder="Nume" value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle} required
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle} required
        />
        <textarea
          placeholder="Mesaj..." value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3} style={{ ...inputStyle, resize: 'none' }} required
        />
        <button type="submit" style={{
          padding: '8px 16px', borderRadius: '8px', border: 'none',
          background: color, color: '#fff', fontSize: '13px',
          fontWeight: 600, cursor: 'pointer',
        }}>
          Trimite mesaj
        </button>
      </div>
    </form>
  );
}

export default function MessageList({ messages, isLoading, color, botName = 'AI Assistant', botSubtitle = 'AI Agent', botMessageColor = '#f5f5f5', avatarUrl, userMessageColor, onFeedback, feedbackSubmitted, operatorTyping, onRequestHuman, onDismissEscalation, onContactSubmit, showContactForm, chatMode }) {
  const endRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, operatorTyping]);

  // Re-render every 30s to update relative timestamps
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      backgroundColor: '#fff',
    }}>
      {messages.map((msg, i) => {
        if (msg.role === 'feedback') {
          return <FeedbackCard key={i} onSubmit={onFeedback} color={color} submitted={feedbackSubmitted} />;
        }

        /* System message - centered, subtle */
        if (msg.role === 'system') {
          return (
            <div key={i} style={{
              textAlign: 'center', padding: '8px 16px', margin: '4px 0',
            }}>
              <span style={{
                fontSize: '12px', color: '#888',
                background: '#f3f4f6', borderRadius: '12px',
                padding: '4px 12px', display: 'inline-block',
              }}>
                {msg.content}
              </span>
            </div>
          );
        }

        /* Escalation prompt - inline card */
        if (msg.role === 'escalation') {
          return (
            <div key={i} style={{
              margin: '8px 0', padding: '12px 16px',
              background: '#f8f9fa', borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', lineHeight: '1.4' }}>
                Nu am gasit cel mai bun raspuns. Doriti sa vorbiti cu un operator?
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={onRequestHuman}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                    background: color, color: '#fff', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {msg.operatorsOnline ? 'Da, conecteaza-ma' : 'Lasa un mesaj'}
                </button>
                <button
                  onClick={onDismissEscalation}
                  style={{
                    padding: '6px 14px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: '#fff',
                    color: '#374151', fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  Nu, multumesc
                </button>
              </div>
            </div>
          );
        }

        const isUser = msg.role === 'user';
        const senderLabel = msg.senderType === 'operator'
          ? (msg.operatorName || 'Operator')
          : botName;
        const senderSub = msg.senderType === 'operator' ? 'Operator' : botSubtitle;

        return (
          <div key={i} className="cw-msg">
            <div style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '14px',
                lineHeight: '20px',
                wordBreak: 'break-word',
                backgroundColor: isUser ? (userMessageColor || color) : botMessageColor,
                color: isUser ? '#fff' : '#1a1a1a',
              }}>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="attachment"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '180px',
                      borderRadius: '8px',
                      marginBottom: msg.content && msg.content !== '(imagine)' ? '6px' : '0',
                      display: 'block',
                    }}
                  />
                )}
                {msg.content && msg.content !== '(imagine)' && (isUser ? msg.content : renderText(msg.content))}
              </div>
            </div>
            {/* Attribution */}
            {!isUser && (
              <div style={{
                fontSize: '11px',
                color: '#999',
                marginTop: '4px',
                paddingLeft: '2px',
              }}>
                {senderLabel} &middot; {senderSub} &middot; {timeAgo(msg.time)}
              </div>
            )}
          </div>
        );
      })}

      {/* Contact form inline */}
      {showContactForm && <ContactFormInline onSubmit={onContactSubmit} color={color} />}

      {/* Operator typing indicator */}
      {operatorTyping && (
        <div className="cw-msg">
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 4px',
              backgroundColor: botMessageColor,
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`cw-d${n}`} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#999', display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', paddingLeft: '2px' }}>
            Operator scrie...
          </div>
        </div>
      )}

      {/* Bot typing indicator */}
      {isLoading && (
        <div className="cw-msg">
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 4px',
              backgroundColor: botMessageColor,
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
            }}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`cw-d${n}`} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#999', display: 'inline-block',
                }} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', paddingLeft: '2px' }}>
            {botName} scrie...
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
