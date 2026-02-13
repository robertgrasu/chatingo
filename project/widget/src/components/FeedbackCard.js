import React, { useState } from 'react';

export default function FeedbackCard({ onSubmit, color, submitted }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState('');
  const [phase, setPhase] = useState('stars'); // 'stars' | 'comment' | 'done'

  const done = submitted || phase === 'done';

  const handleStarClick = (rating) => {
    if (done || selected > 0) return;
    setSelected(rating);
    setPhase('comment');
  };

  const handleSubmit = () => {
    onSubmit(selected, comment.trim() || null);
    setPhase('done');
  };

  const handleSkip = () => {
    onSubmit(selected, null);
    setPhase('done');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      padding: '4px 16px 8px',
    }}>
      <div style={{
        background: '#f5f5f5',
        borderRadius: '16px',
        padding: '12px 16px',
        maxWidth: '280px',
        width: '100%',
      }}>
        {done ? (
          <div style={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
            Multumim pentru feedback! {selected > 0 && (
              <span style={{ color: '#f5a623' }}>
                {'★'.repeat(selected)}{'☆'.repeat(5 - selected)}
              </span>
            )}
          </div>
        ) : phase === 'comment' ? (
          <>
            <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px', fontWeight: 500 }}>
              <span style={{ color: '#f5a623' }}>{'★'.repeat(selected)}{'☆'.repeat(5 - selected)}</span>
              {' '}
              <span style={{ color: '#999', fontWeight: 400, fontSize: '12px' }}>Adauga un comentariu (optional)</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Spune-ne mai multe..."
              rows={2}
              maxLength={500}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '13px',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
                marginBottom: '6px',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = color; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd'; }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleSkip}
                style={{
                  flex: 1, padding: '6px', fontSize: '12px',
                  border: '1px solid #ddd', borderRadius: '8px',
                  background: 'transparent', cursor: 'pointer',
                  color: '#999', fontFamily: 'inherit',
                }}
              >
                Sari
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  flex: 1, padding: '6px', fontSize: '12px',
                  border: 'none', borderRadius: '8px',
                  background: color, color: '#fff', cursor: 'pointer',
                  fontWeight: 500, fontFamily: 'inherit',
                }}
              >
                Trimite
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '13px',
              color: '#333',
              marginBottom: '8px',
              fontWeight: 500,
            }}>
              Cum a fost experienta?
            </div>
            <div style={{
              display: 'flex',
              gap: '4px',
              justifyContent: 'center',
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    appearance: 'none',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '22px',
                    lineHeight: 1,
                    color: (hovered >= star || selected >= star) ? '#f5a623' : '#ccc',
                    transition: 'color 150ms, transform 150ms',
                    transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
                  }}
                  aria-label={`${star} stea`}
                >
                  {(hovered >= star || selected >= star) ? '★' : '☆'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
