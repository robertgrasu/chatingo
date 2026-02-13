import React from 'react';

export function getBubbleIcon(type, size = 26, strokeColor = 'white') {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: strokeColor, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' };

  switch (type) {
    case 'message':
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 5L2 7" />
        </svg>
      );
    case 'support':
      return (
        <svg {...props}>
          <path d="M3 18v-6a9 9 0 0118 0v6" />
          <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
        </svg>
      );
    case 'bot':
      return (
        <svg {...props}>
          <path d="M12 2l1.09 3.26L16.36 6l-3.27 1.09L12 10.36l-1.09-3.27L7.64 6l3.27-1.09L12 2z" />
          <path d="M18 12l.7 2.1 2.3.7-2.3.7-.7 2.1-.7-2.1-2.3-.7 2.3-.7L18 12z" />
          <path d="M7 16l.5 1.5 1.5.5-1.5.5L7 20l-.5-1.5L5 18l1.5-.5L7 16z" />
        </svg>
      );
    case 'lightning':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={strokeColor} stroke="none" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...props}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={strokeColor} stroke="none" />
        </svg>
      );
    case 'chat':
    default:
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <line x1="9" y1="10" x2="15" y2="10" opacity="0.7" />
          <line x1="9" y1="13" x2="13" y2="13" opacity="0.5" />
        </svg>
      );
  }
}
