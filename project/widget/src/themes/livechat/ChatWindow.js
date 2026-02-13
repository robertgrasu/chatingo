import React, { useState } from 'react';
import InputBox from './InputBox';
import MessageList from './MessageList';
import QuickReplies from '../../components/QuickReplies';

export default function ChatWindow({
  messages, onSend, onClose, isLoading, color,
  headerColor, botName, botSubtitle, botMessageColor,
  avatarColor, placeholderText, position, avatarUrl,
  showOnlineStatus = true, showSubtitle = true,
  enableEmoji = true, enableAttachments = true, enableVoice = false,
  sendButtonColor, userMessageColor, avatarSize = 42,
  quickReplies = [], onQuickReply, onFeedback, feedbackSubmitted,
}) {
  const isRight = position !== 'bottom-left';
  const font = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
  const [barExpanded, setBarExpanded] = useState(false);
  const avExpanded = Math.round(avatarSize * 0.86);
  const avCollapsed = Math.round(avatarSize * 0.67);

  const headerBtnStyle = {
    appearance: 'none',
    background: 'rgb(221, 221, 221)',
    margin: 0,
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    color: 'rgb(17, 17, 17)',
    transition: 'background-color 200ms cubic-bezier(0.14, 0, 0, 1)',
    outline: 'none',
  };

  return (
    <div
      className="lc-widget"
      style={{
        position: 'fixed',
        bottom: '90px',
        [isRight ? 'right' : 'left']: '1em',
        width: '400px',
        height: 'calc(100% - 120px)',
        maxHeight: '600px',
        minHeight: '300px',
        zIndex: 2147483003,
        fontFamily: font,
        padding: '1em',
        transformOrigin: isRight ? 'bottom right' : 'bottom left',
      }}
    >
      {/* Main container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
        overflow: 'hidden',
        isolation: 'isolate',
        borderRadius: '24px',
        background: 'rgb(246, 246, 247)',
      }}>

        {/* Header overlay zone - buttons + agent bar float over messages */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          pointerEvents: 'none',
        }}>
          {/* Backdrop blur gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: barExpanded ? '110px' : '90px',
            mask: 'linear-gradient(black 55%, rgba(0,0,0,0) 100%)',
            WebkitMask: 'linear-gradient(black 55%, rgba(0,0,0,0) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'height 700ms cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }} />

          {/* Top buttons row */}
          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 8px 0',
            pointerEvents: 'auto',
          }}>
            {/* Menu button */}
            <button
              type="button"
              aria-label="Menu"
              style={headerBtnStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(209, 209, 209)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(221, 221, 221)'}
            >
              <svg viewBox="0 0 28 28" style={{ width: '1.75rem', height: '1.75rem', fill: 'currentcolor' }}>
                <path d="M7,16 C8.1045695,16 9,15.1045695 9,14 C9,12.8954305 8.1045695,12 7,12 C5.8954305,12 5,12.8954305 5,14 C5,15.1045695 5.8954305,16 7,16 Z M14,16 C15.1045695,16 16,15.1045695 16,14 C16,12.8954305 15.1045695,12 14,12 C12.8954305,12 12,12.8954305 12,14 C12,15.1045695 12.8954305,16 14,16 Z M21,16 C22.1045695,16 23,15.1045695 23,14 C23,12.8954305 22.1045695,12 21,12 C19.8954305,12 19,12.8954305 19,14 C19,15.1045695 19.8954305,16 21,16 Z" />
              </svg>
            </button>
            {/* Minimize button */}
            <button
              type="button"
              aria-label="Minimize window"
              onClick={onClose}
              style={headerBtnStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(209, 209, 209)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(221, 221, 221)'}
            >
              <svg viewBox="0 0 28 28" style={{ width: '1.75rem', height: '1.75rem', fill: 'currentcolor' }}>
                <path d="M21,18 C21.5522847,18 22,18.4477153 22,19 C22,19.5522847 21.5522847,20 21,20 L7,20 C6.44771525,20 6,19.5522847 6,19 C6,18.4477153 6.44771525,18 7,18 L21,18 Z" fillRule="nonzero" />
              </svg>
            </button>
          </div>

          {/* Dynamic Island - Agent Bar */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div
              onClick={() => setBarExpanded(!barExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: barExpanded ? '12px 16px' : '8px 12px',
                borderRadius: '24px',
                backgroundColor: 'rgb(255, 255, 255)',
                boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
                outline: 'rgb(227, 227, 227) solid 1px',
                outlineOffset: '-1px',
                width: barExpanded ? '260px' : '140px',
                height: barExpanded ? '60px' : '40px',
                transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1), height 700ms cubic-bezier(0.16, 1, 0.3, 1), padding 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 4,
                pointerEvents: 'auto',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: barExpanded ? `${avExpanded}px` : `${avCollapsed}px`,
                height: barExpanded ? `${avExpanded}px` : `${avCollapsed}px`,
                position: 'relative',
                overflow: 'visible',
                borderRadius: '50%',
                border: '0.5px solid rgb(227, 227, 227)',
                flexShrink: 0,
                margin: barExpanded
                  ? (avExpanded > 36 ? `${-Math.round((avExpanded - 36) / 2)}px 0` : 0)
                  : (avCollapsed > 24 ? `${-Math.round((avCollapsed - 24) / 2)}px 0` : 0),
                transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1), height 700ms cubic-bezier(0.16, 1, 0.3, 1), margin 700ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" style={{
                    width: barExpanded ? `${avExpanded}px` : `${avCollapsed}px`,
                    height: barExpanded ? `${avExpanded}px` : `${avCollapsed}px`,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1), height 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width={barExpanded ? Math.round(avExpanded * 0.5) : Math.round(avCollapsed * 0.5)} height={barExpanded ? Math.round(avExpanded * 0.5) : Math.round(avCollapsed * 0.5)} viewBox="0 0 24 24" fill="none">
                      <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {/* Green status dot */}
                {showOnlineStatus && (
                  <div style={{
                    position: 'absolute',
                    background: 'rgb(38, 135, 80)',
                    border: '2px solid rgb(255, 255, 255)',
                    borderRadius: '50%',
                    width: barExpanded ? '10px' : '8px',
                    height: barExpanded ? '10px' : '8px',
                    top: '-2px',
                    right: '-2px',
                    transition: 'width 700ms, height 700ms',
                  }} />
                )}
              </div>

              {/* Name + subtitle */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                marginLeft: '8px',
                minWidth: 0,
              }}>
                <span style={{
                  fontSize: barExpanded ? (showSubtitle ? '0.8125rem' : '0.9375rem') : (showSubtitle ? '0.75rem' : '0.8125rem'),
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  lineHeight: '1.25rem',
                  color: 'rgb(17, 17, 17)',
                  transition: 'font-size 700ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  {botName}
                </span>
                {barExpanded && showSubtitle && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgb(17, 17, 17)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    opacity: 0.6,
                    lineHeight: '1.1rem',
                    marginTop: '1px',
                  }}>
                    {botSubtitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages area - full height, scrolls under header */}
        <div style={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
        }}>
          <MessageList
            messages={messages}
            isLoading={isLoading}
            color={color}
            botName={botName}
            botSubtitle={botSubtitle}
            botMessageColor={botMessageColor}
            avatarColor={avatarColor}
            avatarUrl={avatarUrl}
            userMessageColor={userMessageColor}
            onFeedback={onFeedback}
            feedbackSubmitted={feedbackSubmitted}
          />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <QuickReplies replies={quickReplies} onSelect={onQuickReply} color={color} />
        )}

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
        />

        {/* Powered by footer */}
        <div style={{
          flexShrink: 0,
          fontSize: '12px',
          padding: '4px 0 8px',
          textAlign: 'center',
        }}>
          <span style={{
            color: 'rgb(87, 87, 87)',
          }}>
            Powered by <strong style={{ color: 'rgb(17, 17, 17)' }}>ChatBot</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
