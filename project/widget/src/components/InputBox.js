import React, { useState, useRef } from 'react';
import EmojiPicker from './EmojiPicker';

export default function InputBox({
  onSend, disabled, color, placeholderText = 'Mesaj...',
  sendButtonColor, enableEmoji = true, enableAttachments = true, enableVoice = false,
}) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
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
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage({ dataUrl: ev.target.result, name: file.name });
    };
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

  const btnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8a8a8a',
    outline: 'none',
  };

  const effectiveSendColor = sendButtonColor || color;

  return (
    <div style={{
      borderTop: '1px solid #e8e8e8',
      backgroundColor: '#fff',
      flexShrink: 0,
      position: 'relative',
    }}>
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
        <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={image.dataUrl}
              alt="preview"
              style={{ height: '48px', borderRadius: '8px', objectFit: 'cover' }}
            />
            <button
              onClick={() => setImage(null)}
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#ef4444', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </div>
          <span style={{ fontSize: '11px', color: '#999' }}>{image.name}</span>
        </div>
      )}

      {/* Textarea area */}
      <div style={{ padding: '10px 16px 4px' }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={disabled}
          rows={1}
          style={{
            width: '100%', border: 'none', outline: 'none',
            backgroundColor: 'transparent', fontSize: '14px',
            fontFamily: 'inherit', color: '#1a1a1a',
            lineHeight: '20px', resize: 'none',
            minHeight: '20px', maxHeight: '80px',
          }}
        />
      </div>

      {/* Composer actions bar */}
      <div style={{
        padding: '6px 16px 12px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        {/* Left: action buttons */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          {/* Image attach */}
          {enableAttachments && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button type="button" style={btnStyle} title="Ataseaza imagine" onClick={() => fileRef.current?.click()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
            </>
          )}

          {/* Voice input */}
          {enableVoice && (window.SpeechRecognition || window.webkitSpeechRecognition) && (
            <button
              type="button"
              style={{ ...btnStyle, color: isListening ? '#ef4444' : '#8a8a8a', position: 'relative' }}
              title={isListening ? 'Opreste inregistrarea' : 'Vorbeste'}
              onClick={toggleVoice}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              {isListening && (
                <span style={{
                  position: 'absolute', width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#ef4444', top: '0', right: '0',
                  animation: 'cw-pulse 1s infinite',
                }} />
              )}
            </button>
          )}

          {/* Emoji button */}
          {enableEmoji && (
            <button
              type="button"
              style={{ ...btnStyle, color: showEmoji ? color : '#8a8a8a' }}
              title="Emoji"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.525" stroke="currentColor" strokeWidth="1.7"/>
                <path fill="currentColor" fillRule="evenodd" d="M5.819 7.536a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2zm4.363 0a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" clipRule="evenodd"/>
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" d="M10 10c-.44.604-1.172 1-2 1s-1.56-.396-2-1"/>
              </svg>
            </button>
          )}
        </div>

        {/* Right: send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: canSend ? effectiveSendColor : '#e0e0e0',
            border: 'none', cursor: canSend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.15s',
            outline: 'none', padding: 0, flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path fill="white" fillRule="evenodd" d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5A.85.85 0 1111.9 7.6L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601A.85.85 0 112.9 6.399z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
