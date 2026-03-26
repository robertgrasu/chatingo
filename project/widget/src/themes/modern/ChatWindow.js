import React, { useState, useEffect } from 'react';
import InputBox from './InputBox';
import MessageList from './MessageList';
import QuickReplies from '../../components/QuickReplies';

export default function ChatWindow({
  messages, onSend, onClose, isLoading, color,
  headerColor, botName, botSubtitle, botMessageColor,
  avatarColor, placeholderText, position, avatarUrl,
  gradientEndColor, gradientAngle,
  showOnlineStatus = true, showSubtitle = true,
  enableEmoji = true, enableAttachments = true, enableVoice = false,
  sendButtonColor, userMessageColor, avatarSize = 42,
  quickReplies = [], onQuickReply, onFeedback, feedbackSubmitted,
  chatMode, operatorName: opName, operatorTyping, showContactForm,
  onRequestHuman, onDismissEscalation, onContactSubmit, liveChatEnabled,
  onInputChange,
}) {
  const isRight = position !== 'bottom-left';
  const grad = gradientEndColor
    ? `linear-gradient(${gradientAngle ?? 135}deg, ${color}, ${gradientEndColor})`
    : color;
  const [visible, setVisible] = useState(false);
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      [isRight ? 'right' : 'left']: '1.25em',
      width: '380px',
      height: 'calc(100% - 120px)',
      maxHeight: '620px',
      minHeight: '300px',
      zIndex: 2147483003,
      fontFamily: font,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
      transition: 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
      transformOrigin: isRight ? 'bottom right' : 'bottom left',
    }}>
      {/* Keyframes for typing dots */}
      <style dangerouslySetInnerHTML={{ __html: [
        '@keyframes cwModernBounce {',
        '  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }',
        '  40% { transform: translateY(-5px); opacity: 1; }',
        '}',
        '.cw-modern-msgs::-webkit-scrollbar { width: 4px; }',
        '.cw-modern-msgs::-webkit-scrollbar-track { background: transparent; }',
        '.cw-modern-msgs::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }',
      ].join('\n') }} />

      {/* Main container — bg matches header so no white bleeds at corners */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        borderRadius: '20px',
        background: grad,
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Gradient header */}
        <div style={{
          background: grad,
          padding: '18px 18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          overflow: 'visible',
        }}>
          {/* Avatar with status dot */}
          <div style={{ position: 'relative', flexShrink: 0, margin: avatarSize > 42 ? `${-Math.round((avatarSize - 42) / 2)}px 0` : 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} style={{
                width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.25)',
              }} />
            ) : (
              <div style={{
                width: `${avatarSize}px`, height: `${avatarSize}px`, borderRadius: '50%',
                background: avatarColor || color,
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={Math.round(avatarSize * 0.48)} height={Math.round(avatarSize * 0.48)} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            )}
            {/* Green online dot */}
            {showOnlineStatus && (
              <div style={{
                position: 'absolute', bottom: '0px', right: '0px',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid rgba(255,255,255,0.9)',
              }} />
            )}
          </div>

          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#ffffff', fontWeight: 600, fontSize: showSubtitle ? '15px' : '17px',
              lineHeight: '1.3',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {chatMode === 'live' && opName ? opName : botName}
            </div>
            {showSubtitle && (
              <div style={{
                color: 'rgba(255,255,255,0.7)', fontSize: '12.5px',
                lineHeight: '1.3', marginTop: '2px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {chatMode === 'live' ? 'Live Chat' : chatMode === 'waiting' ? 'Se conecteaza...' : (botSubtitle || 'Online')}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            aria-label="Close"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', flexShrink: 0,
              transition: 'background 200ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* White content area — covers gradient bg below header */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#ffffff', minHeight: 0,
          borderRadius: '0 0 20px 20px', overflow: 'hidden',
        }}>
          {/* Messages */}
          <MessageList
            messages={messages}
            isLoading={isLoading}
            color={color}
            botName={botName}
            avatarColor={avatarColor}
            avatarUrl={avatarUrl}
            userMessageColor={userMessageColor}
            onFeedback={onFeedback}
            feedbackSubmitted={feedbackSubmitted}
            operatorTyping={operatorTyping}
            onRequestHuman={onRequestHuman}
            onDismissEscalation={onDismissEscalation}
            onContactSubmit={onContactSubmit}
            showContactForm={showContactForm}
            chatMode={chatMode}
          />

          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <QuickReplies replies={quickReplies} onSelect={onQuickReply} color={color} />
          )}

          {/* Separator line */}
          <div style={{ height: '1px', background: '#f0f1f3', flexShrink: 0 }} />

          {/* Input */}
          <InputBox
            onSend={onSend}
            disabled={isLoading}
            color={color}
            placeholderText={placeholderText}
            sendButtonColor={sendButtonColor}
            enableEmoji={enableEmoji}
            enableAttachments={enableAttachments}
            enableVoice={enableVoice}
            onInputChange={onInputChange}
          />

          {/* Footer */}
          <div style={{
            flexShrink: 0,
            textAlign: 'center',
            padding: '2px 0 10px',
            fontSize: '11px',
            color: '#b0b4ba',
          }}>
            Powered by <strong style={{ color: '#8b8f96' }}>ChatBot</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
