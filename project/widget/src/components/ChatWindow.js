import React from 'react';
import InputBox from './InputBox';
import MessageList from './MessageList';
import QuickReplies from './QuickReplies';

export default function ChatWindow({
  messages, onSend, onClose, isLoading, color,
  headerColor = '#14161a', botName = 'AI Assistant', botSubtitle = 'AI Agent',
  botMessageColor = '#f5f5f5', avatarColor = '#6366f1', avatarUrl,
  placeholderText = 'Mesaj...', position,
  showOnlineStatus = true, showSubtitle = true,
  enableEmoji = true, enableAttachments = true, enableVoice = false,
  sendButtonColor, userMessageColor, avatarSize = 42,
  quickReplies = [], onQuickReply, onFeedback, feedbackSubmitted,
}) {
  const isRight = position !== 'bottom-left';
  const font = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

  return (
    <div
      className="cw-messenger"
      style={{
        position: 'fixed',
        bottom: '84px',
        [isRight ? 'right' : 'left']: '20px',
        width: '400px',
        height: 'calc(100% - 120px)',
        maxHeight: '550px',
        minHeight: '250px',
        backgroundColor: headerColor,
        borderRadius: '24px',
        boxShadow: '0 5px 40px rgba(0,0,0,0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 2147483003,
        fontFamily: font,
      }}
    >
      {/* Header - Dark Intercom style */}
      <div style={{
        height: '64px',
        backgroundColor: headerColor,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}>
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          {/* Left: Avatar + Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            {/* Squircle avatar */}
            <div style={{ position: 'relative', flexShrink: 0, margin: avatarSize > 32 ? `${-Math.round((avatarSize - 32) / 2)}px 0` : 0 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{
                  width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '8px', objectFit: 'cover',
                }} />
              ) : (
                <div style={{
                  width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '8px',
                  background: avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width={Math.round(avatarSize * 0.5)} height={Math.round(avatarSize * 0.5)} viewBox="0 0 24 24" fill="none">
                    <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              {showOnlineStatus && (
                <div style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid ' + headerColor,
                }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                color: '#fff', fontSize: showSubtitle ? '14px' : '16px', fontWeight: 600, lineHeight: showSubtitle ? '18px' : '22px',
              }}>
                {botName}
              </div>
              {showSubtitle && (
                <div style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '16px', marginTop: '1px',
                }}>
                  {botSubtitle}
                </div>
              )}
            </div>
          </div>

          {/* Right: Close button */}
          <div
            onClick={onClose}
            role="button"
            tabIndex={0}
            aria-label="Închidere"
            style={{
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', borderRadius: '6px',
              transition: 'background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.25 3.95L12.05 2.75L8 6.8L3.95 2.75L2.75 3.95L6.8 8L2.75 12.05L3.95 13.25L8 9.2L12.05 13.25L13.25 12.05L9.2 8L13.25 3.95Z" fill="white"/>
            </svg>
          </div>
        </nav>
      </div>

      {/* Content area - white background */}
      <div style={{
        flex: 1, backgroundColor: '#fff',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <MessageList
          messages={messages} isLoading={isLoading} color={color}
          botName={botName} botSubtitle={botSubtitle}
          botMessageColor={botMessageColor} avatarUrl={avatarUrl}
          userMessageColor={userMessageColor}
          onFeedback={onFeedback} feedbackSubmitted={feedbackSubmitted}
        />
        {quickReplies.length > 0 && (
          <QuickReplies replies={quickReplies} onSelect={onQuickReply} color={color} />
        )}
        <InputBox
          onSend={onSend} disabled={isLoading} color={color}
          placeholderText={placeholderText}
          sendButtonColor={sendButtonColor}
          enableEmoji={enableEmoji}
          enableAttachments={enableAttachments}
          enableVoice={enableVoice}
        />
      </div>
    </div>
  );
}
