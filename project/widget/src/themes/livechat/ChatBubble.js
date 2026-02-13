import React from 'react';
import { getBubbleIcon } from '../../components/BubbleIcons';

export default function ChatBubble({ onClick, color, bubbleColor = '#ffffff', bubbleIconColor = '#111111', bubbleIcon = 'chat', position, isOpen }) {
  const isRight = position !== 'bottom-left';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? 'Minimize window' : 'Open chat'}
      className="lc-bubble"
      style={{
        position: 'fixed',
        bottom: '1em',
        [isRight ? 'right' : 'left']: '1em',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: bubbleColor,
        cursor: 'pointer',
        display: isOpen ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'rgba(0,0,0,0.125) 0px 0.362176px 0.941657px -1px, rgba(0,0,0,0.18) 0px 3px 7.8px -2px',
        zIndex: 2147483003,
        transition: 'transform 200ms cubic-bezier(0.14, 0, 0, 1)',
        border: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        boxSizing: 'content-box',
        userSelect: 'none',
        overflow: 'visible',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {/* Chat icon */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        transition: 'transform 200ms cubic-bezier(0.14, 0, 0, 1), opacity 150ms',
        opacity: isOpen ? 0 : 1,
        transform: isOpen ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)',
      }}>
        {getBubbleIcon(bubbleIcon, 24, bubbleIconColor)}
      </div>
      {/* Minimize icon */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        transition: 'transform 200ms cubic-bezier(0.14, 0, 0, 1), opacity 150ms',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
      }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M21,18 C21.5522847,18 22,18.4477153 22,19 C22,19.5522847 21.5522847,20 21,20 L7,20 C6.44771525,20 6,19.5522847 6,19 C6,18.4477153 6.44771525,18 7,18 L21,18 Z"
            fill={bubbleIconColor} fillRule="nonzero"
          />
        </svg>
      </div>
    </div>
  );
}
