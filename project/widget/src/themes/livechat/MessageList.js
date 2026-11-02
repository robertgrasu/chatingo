import React, { useEffect, useRef, useState } from 'react';
import FeedbackCard from '../../components/FeedbackCard';

function timeAgo(ts) {
  if (!ts) return 'Chiar acum';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'Chiar acum';
  if (diff < 60) return `Acum ${diff}s`;
  const mins = Math.floor(diff / 60);
  if (mins === 1) return 'Acum 1 minut';
  if (mins < 60) return `Acum ${mins} minute`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return 'Acum 1 ora';
  if (hrs < 24) return `Acum ${hrs} ore`;
  return 'Ieri';
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
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
        style: { margin: '8px 0', paddingLeft: '24px', listStyleType: listType === 'ol' ? 'decimal' : 'disc' },
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

/* Check if we should show a time separator between messages */
function shouldShowTimeSeparator(prevMsg, currMsg) {
  if (!prevMsg || !currMsg) return false;
  const diff = Math.abs((currMsg.time || 0) - (prevMsg.time || 0));
  return diff > 300000; // 5 min gap
}

const msgShadow = 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px, rgba(0,0,0,0.04) 0px 10px 9px -4px';

export default function MessageList({ messages, isLoading, color, botName, botSubtitle, botMessageColor, avatarColor, avatarUrl, userMessageColor, onFeedback, feedbackSubmitted, operatorTyping, onRequestHuman, onDismissEscalation, onContactSubmit, showContactForm, chatMode }) {
  const endRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, operatorTyping]);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      padding: '90px 20px 20px',
      background: 'transparent',
      overscrollBehavior: 'contain',
      overflowY: 'auto',
      position: 'absolute',
      inset: 0,
    }}>

      {messages.map((msg, i) => {
        if (msg.role === 'feedback') {
          return <FeedbackCard key={i} onSubmit={onFeedback} color={color} submitted={feedbackSubmitted} />;
        }
        if (msg.role === 'system') {
          return (
            <div key={i} style={{ textAlign: 'center', padding: '8px 16px', margin: '4px 0' }}>
              <span style={{ fontSize: '12px', color: 'rgb(112,112,112)', background: 'rgba(0,0,0,0.04)', borderRadius: '12px', padding: '4px 12px', display: 'inline-block' }}>
                {msg.content}
              </span>
            </div>
          );
        }
        if (msg.role === 'escalation') {
          return (
            <div key={i} style={{ margin: '8px 0', padding: '12px 16px', background: 'rgb(255,255,255)', borderRadius: '12px', boxShadow: msgShadow }}>
              <div style={{ fontSize: '13px', color: 'rgb(55,65,81)', marginBottom: '10px', lineHeight: '1.4' }}>
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
        const prevMsg = i > 0 ? messages[i - 1] : null;
        const showTimeSep = shouldShowTimeSeparator(prevMsg, msg);
        const prevIsSameRole = prevMsg && prevMsg.role === msg.role;

        return (
          <React.Fragment key={i}>
            {/* Timestamp separator */}
            {showTimeSep && (
              <div style={{
                height: '20px',
                margin: '16px -0.5em',
                textAlign: 'center',
                overflow: 'hidden',
              }}>
                <span style={{
                  fontSize: '12px',
                  position: 'relative',
                  padding: '0 8px',
                  color: 'rgb(112, 112, 112)',
                  background: 'rgb(246, 246, 247)',
                }}>
                  {formatTime(msg.time)}
                </span>
              </div>
            )}

            {isUser ? (
              /* User message - right aligned, row-reverse */
              <div className="lc-msg" style={{
                display: 'flex',
                marginBottom: '1em',
                flexDirection: 'row-reverse',
              }}>
                <div style={{ flexGrow: 1, maxWidth: '100%', flexShrink: 1 }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    alignItems: 'flex-start',
                    fontSize: '0.9em',
                    marginBottom: '0.3em',
                    maxWidth: '100%',
                    lineHeight: '1.25em',
                    color: 'rgb(112, 112, 112)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'row-reverse', maxWidth: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                          {/* User bubble */}
                          <div style={{
                            display: 'inline-block',
                            maxWidth: '280px',
                            marginBottom: '0.1em',
                            boxShadow: msgShadow,
                            border: 0,
                            background: userMessageColor || color,
                            color: '#fff',
                            borderRadius: '10px',
                          }}>
                            {msg.image && (
                              <img src={msg.image} alt="attachment" style={{
                                maxWidth: '100%',
                                maxHeight: '180px',
                                borderRadius: '10px 10px 0 0',
                                display: 'block',
                              }} />
                            )}
                            {msg.content && msg.content !== '(imagine)' && (
                              <div style={{
                                whiteSpace: 'pre-line',
                                overflowWrap: 'anywhere',
                                maxWidth: '100%',
                                padding: '12px 18px 14px',
                                fontSize: '14px',
                              }}>
                                {msg.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Read status */}
                      <div style={{ textAlign: 'right', fontSize: '0.8em', color: 'rgb(112, 112, 112)', marginTop: '2px' }}>
                        {timeAgo(msg.time)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Agent message - left aligned, with avatar */
              <div className="lc-msg" style={{
                display: 'flex',
                marginBottom: '1em',
              }}>
                {/* Avatar column */}
                {!prevIsSameRole && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    fontSize: '0.7em',
                    lineHeight: '1.6em',
                    minWidth: '20px',
                    margin: '0 8px 0 0',
                    flexGrow: 0,
                  }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }} />
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        border: 0,
                        width: '20px',
                        height: '20px',
                        lineHeight: '20px',
                        borderRadius: '50%',
                        fontSize: '10px',
                        background: avatarColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
                {prevIsSameRole && <div style={{ minWidth: '28px' }} />}

                <div style={{ flexGrow: 1, maxWidth: '100%', flexShrink: 1 }}>
                  <div style={{
                    alignItems: 'flex-start',
                    fontSize: '0.9em',
                    marginBottom: '0.3em',
                    maxWidth: '100%',
                    lineHeight: '1.25em',
                    color: 'rgb(112, 112, 112)',
                    justifyContent: 'flex-start',
                    flexDirection: 'row',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'row', maxWidth: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                          {/* Agent bubble */}
                          <div style={{
                            display: 'inline-block',
                            maxWidth: '280px',
                            marginBottom: '0.1em',
                            boxShadow: msgShadow,
                            border: 0,
                            background: 'rgb(255, 255, 255)',
                            color: 'rgb(17, 17, 17)',
                            borderRadius: '10px',
                          }}>
                            {msg.image && (
                              <img src={msg.image} alt="attachment" style={{
                                maxWidth: '100%',
                                maxHeight: '180px',
                                borderRadius: '10px 10px 0 0',
                                display: 'block',
                              }} />
                            )}
                            {msg.content && msg.content !== '(imagine)' && (
                              <div style={{
                                whiteSpace: 'pre-line',
                                overflowWrap: 'anywhere',
                                maxWidth: '100%',
                                padding: '12px 18px 14px',
                                fontSize: '14px',
                              }}>
                                {renderText(msg.content)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Operator typing indicator */}
      {operatorTyping && (
        <div className="lc-msg" style={{ display: 'flex', marginBottom: '1em' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '20px', margin: '0 8px 0 0', flexGrow: 0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <div style={{
              display: 'inline-block', padding: '14px 18px', borderRadius: '10px',
              background: 'rgb(255, 255, 255)', boxShadow: msgShadow,
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`cw-d${n}`} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: 'rgb(112, 112, 112)', display: 'inline-block',
                }} />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'rgb(112, 112, 112)', marginTop: '4px' }}>
              Operator scrie...
            </div>
          </div>
        </div>
      )}

      {/* Bot typing indicator */}
      {isLoading && (
        <div className="lc-msg" style={{ display: 'flex', marginBottom: '1em' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '20px', margin: '0 8px 0 0', flexGrow: 0,
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <div style={{
              display: 'inline-block', padding: '14px 18px', borderRadius: '10px',
              background: 'rgb(255, 255, 255)', boxShadow: msgShadow,
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`cw-d${n}`} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: 'rgb(112, 112, 112)', display: 'inline-block',
                }} />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: 'rgb(112, 112, 112)', marginTop: '4px' }}>
              {botName} scrie...
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
