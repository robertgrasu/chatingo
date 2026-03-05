import React, { useState, useRef } from 'react';
import EmojiPicker from '../../components/EmojiPicker';

export default function InputBox({
  onSend, disabled, color, placeholderText = 'Scrie un mesaj...',
  sendButtonColor, enableEmoji = true, enableAttachments = true, enableVoice = false,
}) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [focused, setFocused] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !image) || disabled) return;
    onSend(trimmed || '(imagine)', image ? image.dataUrl : null);
    setText('');
    setImage(null);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const canSend = (text.trim() || image) && !disabled;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (prevent non-image uploads)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { e.target.value = ''; return; }

    // Reject double extensions (e.g. payload.exe.jpg)
    if (file.name.split('.').length > 2) { e.target.value = ''; return; }

    // Client-side size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) { e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (ev) => setImage({ dataUrl: ev.target.result, name: file.name });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ro-RO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const effectiveSendColor = sendButtonColor || color;

  return (
    <div style={{ padding: '10px 16px 12px', flexShrink: 0, background: '#ffffff', position: 'relative' }}>
      {/* Emoji Picker */}
      {showEmoji && (
        <EmojiPicker
          color={color}
          onSelect={(emoji) => {
            setText((prev) => prev + emoji);
            inputRef.current?.focus();
          }}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Image preview */}
      {image && (
        <div style={{ paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <img src={image.dataUrl} alt="preview" style={{ height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
            <button onClick={() => setImage(null)} style={{
              position: 'absolute', top: '-6px', right: '-6px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#ef4444', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>&times;</button>
          </div>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{image.name}</span>
        </div>
      )}

      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Attachment */}
        {enableAttachments && (
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              type="button"
              aria-label="Ataseaza"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: 'none', background: '#f0f1f3', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#6b7280', flexShrink: 0, transition: 'background 200ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e4e5e9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f0f1f3'}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </>
        )}

        {/* Emoji button */}
        {enableEmoji && (
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            type="button"
            aria-label="Emoji"
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: 'none', background: showEmoji ? '#e4e5e9' : '#f0f1f3', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: showEmoji ? color : '#6b7280', flexShrink: 0, transition: 'background 200ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e4e5e9'}
            onMouseLeave={(e) => e.currentTarget.style.background = showEmoji ? '#e4e5e9' : '#f0f1f3'}
          >
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.525" stroke="currentColor" strokeWidth="1.7"/>
              <path fill="currentColor" fillRule="evenodd" d="M5.819 7.536a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2zm4.363 0a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" clipRule="evenodd"/>
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" d="M10 10c-.44.604-1.172 1-2 1s-1.56-.396-2-1"/>
            </svg>
          </button>
        )}

        {/* Voice button */}
        {enableVoice && (window.SpeechRecognition || window.webkitSpeechRecognition) && (
          <button
            onClick={toggleVoice}
            type="button"
            aria-label={isListening ? 'Opreste inregistrarea' : 'Vorbeste'}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: 'none', background: isListening ? '#fee2e2' : '#f0f1f3', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isListening ? '#ef4444' : '#6b7280', flexShrink: 0, transition: 'background 200ms',
              position: 'relative',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = isListening ? '#fecaca' : '#e4e5e9'}
            onMouseLeave={(e) => e.currentTarget.style.background = isListening ? '#fee2e2' : '#f0f1f3'}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            {isListening && (
              <span style={{
                position: 'absolute', width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: '#ef4444', top: '2px', right: '2px',
              }} />
            )}
          </button>
        )}

        {/* Text input wrapper */}
        <div style={{
          flex: 1,
          borderRadius: '22px',
          border: `1.5px solid ${focused ? color : '#e5e7eb'}`,
          background: '#f5f5f7',
          transition: 'border-color 200ms, box-shadow 200ms',
          boxShadow: focused ? `0 0 0 3px ${color}18` : 'none',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholderText}
            disabled={disabled}
            style={{
              width: '100%',
              height: '42px',
              padding: '0 16px',
              border: 'none',
              borderRadius: '22px',
              background: 'transparent',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: '#1f2937',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          type="button"
          aria-label="Trimite"
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            border: 'none',
            background: canSend ? effectiveSendColor : '#e5e7eb',
            cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 200ms, opacity 200ms, background 200ms',
            opacity: canSend ? 1 : 0.5,
          }}
          onMouseEnter={(e) => canSend && (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l7-7 7 7" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
