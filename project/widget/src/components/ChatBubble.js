import React from 'react';
import { getBubbleIcon } from './BubbleIcons';

export default function ChatBubble({ onClick, color, bubbleColor = '#ffffff', bubbleIconColor = '#14161a', position, isOpen, bubbleIcon = 'chat' }) {
  const isRight = position !== 'bottom-left';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={isOpen ? 'Închide chat' : 'Deschide chat'}
      style={{
        position: 'fixed',
        bottom: '20px',
        [isRight ? 'right' : 'left']: '20px',
        width: '60px',
        height: '60px',
        maxWidth: '60px',
        maxHeight: '60px',
        borderRadius: '50%',
        backgroundColor: bubbleColor,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 6px 0 rgba(0, 0, 0, 0.06), 0 2px 32px 0 rgba(0, 0, 0, 0.16)',
        zIndex: 2147483003,
        transition: 'transform 167ms cubic-bezier(0.33, 0.00, 0.00, 1.00)',
        border: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        boxSizing: 'content-box',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transition = 'transform 250ms cubic-bezier(0.33, 0.00, 0.00, 1.00)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transition = 'transform 167ms cubic-bezier(0.33, 0.00, 0.00, 1.00)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transition = 'transform 134ms cubic-bezier(0.45, 0, 0.2, 1)';
        e.currentTarget.style.transform = 'scale(0.85)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transition = 'transform 250ms cubic-bezier(0.33, 0.00, 0.00, 1.00)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {/* Open icon */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        transition: 'transform 100ms linear, opacity 80ms linear',
        opacity: isOpen ? 0 : 1,
        transform: isOpen ? 'rotate(-60deg) scale(0)' : 'rotate(0deg) scale(1)',
      }}>
        {getBubbleIcon(bubbleIcon, 28, bubbleIconColor)}
      </div>
      {/* Minimize icon - down chevron */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '60px',
        height: '60px',
        transition: 'transform 100ms linear, opacity 80ms linear',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'rotate(0deg) scale(1)' : 'rotate(60deg) scale(0)',
      }}>
        <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
          <path d="M3.95 5.15L8 9.2L12.05 5.15L13.25 6.35L8 11.6L2.75 6.35L3.95 5.15Z" fill={bubbleIconColor}/>
        </svg>
      </div>
    </div>
  );
}
