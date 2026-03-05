import React, { useState } from 'react';

export default function QuickReplies({ replies, onSelect, color }) {
  const [selectedCat, setSelectedCat] = useState(null);

  if (!replies || replies.length === 0) return null;

  // Detect format: array of strings (flat) vs array of objects (categories)
  const isCategories = replies.length > 0 && typeof replies[0] === 'object' && replies[0].category;

  const buttonStyle = {
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
  };

  const handleHover = (e) => {
    e.currentTarget.style.background = color;
    e.currentTarget.style.color = '#fff';
  };

  const handleLeave = (e) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = color;
  };

  // Flat format (backward compat)
  if (!isCategories) {
    return (
      <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 4px', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{ __html: '.cw-quick-replies::-webkit-scrollbar { display: none; }' }} />
        <div className="cw-quick-replies" style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {replies.map((text, i) => (
            <button key={i} type="button" onClick={() => onSelect(text)} style={buttonStyle} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
              {text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Categories format
  const activeCat = selectedCat !== null ? replies[selectedCat] : null;

  return (
    <div style={{ padding: '8px 16px 4px', flexShrink: 0 }}>
      <style dangerouslySetInnerHTML={{ __html: '.cw-quick-replies::-webkit-scrollbar { display: none; }' }} />

      {selectedCat === null ? (
        // Show category buttons
        <div className="cw-quick-replies" style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {replies.map((cat, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedCat(i)}
              style={buttonStyle}
              onMouseEnter={handleHover}
              onMouseLeave={handleLeave}
            >
              {cat.category}
            </button>
          ))}
        </div>
      ) : (
        // Show questions for selected category
        <div>
          <button
            type="button"
            onClick={() => setSelectedCat(null)}
            style={{
              appearance: 'none',
              border: 'none',
              background: 'transparent',
              color: '#999',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '2px 0',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontFamily: 'inherit',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            {activeCat.category}
          </button>
          <div className="cw-quick-replies" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {activeCat.questions.map((q, i) => (
              <button key={i} type="button" onClick={() => onSelect(q)} style={buttonStyle} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
