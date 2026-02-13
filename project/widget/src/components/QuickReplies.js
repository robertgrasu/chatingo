import React from 'react';

export default function QuickReplies({ replies, onSelect, color }) {
  if (!replies || replies.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '8px 16px 4px',
      overflowX: 'auto',
      flexShrink: 0,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      <style dangerouslySetInnerHTML={{ __html:
        '.cw-quick-replies::-webkit-scrollbar { display: none; }'
      }} />
      <div className="cw-quick-replies" style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {replies.map((text, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(text)}
            style={{
              appearance: 'none',
              border: `1.5px solid ${color}`,
              background: 'transparent',
              color: color,
              borderRadius: '18px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 200ms, color 200ms',
              fontFamily: 'inherit',
              lineHeight: '1.3',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = color;
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = color;
            }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
