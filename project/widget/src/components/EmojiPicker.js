import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  { id: 'smileys', icon: '😊', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','😍','🤩','😘','😗','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','😐','😑','😶','😏','😒','🙄','😬','😮','😯','😲','😳','🥺','😢','😭','😤','😠','😡','🤯','😱','😰','😥','😓','🤥','😴','🥱'] },
  { id: 'gestures', icon: '👋', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','👏','🙌','🤝','🙏','💪','🫶'] },
  { id: 'hearts', icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫀','💑','💏','💋'] },
  { id: 'objects', icon: '⭐', emojis: ['⭐','🌟','✨','💫','🔥','💥','🎉','🎊','🎈','🎁','🏆','🥇','🎯','💡','📌','📎','✏️','📝','💻','📱','⏰','🔔','🔑','🔒'] },
  { id: 'nature', icon: '🌿', emojis: ['🌸','🌺','🌻','🌹','🌷','🌼','🍀','🌿','🍃','🌱','🌲','🌳','🌴','☀️','🌙','⭐','🌈','☁️','⛅','🌊','❄️','🦋','🐝','🐞'] },
  { id: 'food', icon: '🍕', emojis: ['☕','🍵','🧃','🥤','🍺','🍷','🥂','🍕','🍔','🍟','🌮','🍣','🍰','🎂','🍩','🍪','🍫','🍬','🍭','🍿','🥐','🍞','🥑','🍎'] },
];

export default function EmojiPicker({ onSelect, onClose, color }) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const cat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div ref={ref} style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      marginBottom: '6px',
      background: '#ffffff',
      borderRadius: '14px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
      zIndex: 10,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Category tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f0f0f0',
        padding: '4px 6px 0',
      }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeCategory === c.id ? `2px solid ${color || '#6366f1'}` : '2px solid transparent',
              opacity: activeCategory === c.id ? 1 : 0.5,
              transition: 'all 150ms',
            }}
          >
            {c.icon}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '1px',
        padding: '8px',
        maxHeight: '180px',
        overflowY: 'auto',
      }}>
        {cat.emojis.map((emoji, i) => (
          <button
            key={i}
            onClick={() => { onSelect(emoji); onClose(); }}
            style={{
              width: '100%',
              aspectRatio: '1',
              fontSize: '18px',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 100ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
