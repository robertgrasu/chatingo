import React from 'react';
import { getBubbleIcon } from '../../components/BubbleIcons';

function colorShadow(hex, alpha = 0.4) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ChatBubble({ onClick, color, position, isOpen, gradientEndColor, gradientAngle, bubbleIcon = 'chat' }) {
  const isRight = position !== 'bottom-left';
  const grad = gradientEndColor
    ? `linear-gradient(${gradientAngle ?? 135}deg, ${color}, ${gradientEndColor})`
    : color;
  const shadow = colorShadow(color, 0.4);
  const shadowHover = colorShadow(color, 0.5);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Open chat"
      style={{
        position: 'fixed',
        bottom: '1.25em',
        [isRight ? 'right' : 'left']: '1.25em',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: grad,
        cursor: 'pointer',
        display: isOpen ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 15px ${shadow}`,
        zIndex: 2147483003,
        transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms ease',
        border: 'none',
        outline: 'none',
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = `0 6px 22px ${shadowHover}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `0 4px 15px ${shadow}`;
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      {getBubbleIcon(bubbleIcon, 26, 'white')}
    </div>
  );
}
