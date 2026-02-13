import React, { useState, useRef } from 'react';
import EmojiPicker from '../../components/EmojiPicker';

export default function InputBox({
  onSend, disabled, color, placeholderText = 'Mesaj...',
  sendButtonColor, enableEmoji = true, enableAttachments = true, enableVoice = false,
}) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [started, setStarted] = useState(false);
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
    setStarted(true);
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

  const handleStartChat = () => {
    setStarted(true);
    setTimeout(() => inputRef.current?.focus(), 50);
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

  // "Let's chat" start button (LiveChat style)
  if (!started && text === '' && !image) {
    return (
      <div style={{
        padding: '1em',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9em',
        flexShrink: 0,
      }}>
        <button
          onClick={handleStartChat}
          style={{
            border: 0,
            fontFamily: 'inherit',
            width: '100%',
            maxWidth: '320px',
            flexShrink: 0,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            outlineOffset: '2px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            padding: '12px',
            color: 'rgb(255, 255, 255)',
            backgroundColor: 'rgb(27, 27, 32)',
            transition: 'background-color 200ms',
            outline: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(40, 40, 48)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(27, 27, 32)'}
        >
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Scrie un mesaj
          </span>
        </button>
      </div>
    );
  }

  // Round icon button style (+ and emoji)
  const iconBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'rgb(248, 248, 248)',
    color: 'rgb(17, 17, 17)',
    cursor: 'pointer',
    outline: 'none',
    flexShrink: 0,
    transition: 'background-color 200ms',
  };

  return (
    <div style={{ flexShrink: 0, margin: '0 15px', position: 'relative' }}>
      {/* Emoji Picker */}
      {showEmoji && (
        <EmojiPicker
          onSelect={(emoji) => setText((prev) => prev + emoji)}
          onClose={() => setShowEmoji(false)}
          color={color}
        />
      )}

      {/* Image preview */}
      {image && (
        <div style={{ padding: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={image.dataUrl} alt="preview" style={{ height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
            <button
              onClick={() => setImage(null)}
              style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#ef4444', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >&times;</button>
          </div>
          <span style={{ fontSize: '11px', color: 'rgb(112, 112, 112)' }}>{image.name}</span>
        </div>
      )}

      {/* Input area - relative container for absolute buttons */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: '46px',
      }}>
        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

        {/* Left button: "+" attachment - absolute over textarea */}
        {enableAttachments && (
          <div style={{
            position: 'absolute',
            left: '8px',
            bottom: '7px',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1,
          }}>
            <button
              type="button"
              aria-label="Ataseaza"
              style={iconBtnStyle}
              onClick={() => fileRef.current?.click()}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(237, 237, 237)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(248, 248, 248)'}
            >
              {/* "+" icon - exact LiveChat SVG */}
              <svg viewBox="0 0 32 32" style={{ width: '32px', height: '32px', fill: 'currentcolor', flexShrink: 0 }}>
                <path d="M23,15 C23.5522847,15 24,15.4477153 24,16 C24,16.5522847 23.5522847,17 23,17 L17,16.99905 L17.00005,23.00005 C17.00005,23.5523347 16.5523347,24.00005 16.00005,24.00005 C15.4477653,24.00005 15.00005,23.5523347 15.00005,23.00005 L15,16.99905 L9,17 C8.44771525,17 8,16.5522847 8,16 C8,15.4477153 8.44771525,15 9,15 L15,14.99905 L15.00005,9.00005 C15.00005,8.44776525 15.4477653,8.00005 16.00005,8.00005 C16.5523347,8.00005 17.00005,8.44776525 17.00005,9.00005 L17,15 L23,15 Z" />
              </svg>
            </button>
          </div>
        )}

        {/* Textarea - pill shaped, exact LiveChat styles */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={disabled}
          rows={1}
          style={{
            display: 'block',
            width: '100%',
            height: '46px',
            padding: `11px ${enableVoice ? '120px' : '84px'} 11px ${enableAttachments ? '48px' : '16px'}`,
            border: '1px solid rgb(227, 227, 227)',
            borderRadius: '32px',
            backgroundColor: 'rgb(251, 251, 251)',
            color: 'rgb(17, 17, 17)',
            fontSize: '14px',
            fontFamily: 'inherit',
            lineHeight: '22px',
            resize: 'none',
            outline: 'none',
            boxShadow: 'rgba(0,0,0,0.075) 0px 0.6px 2.05px -1.33px, rgba(0,0,0,0.067) 0px 2.29px 7.78px -2.67px, rgba(0,0,0,0.02) 0px 10px 34px -4px',
            flex: '1 1 auto',
            boxSizing: 'border-box',
          }}
        />

        {/* Right buttons: emoji + voice + send - absolute over textarea */}
        <div style={{
          position: 'absolute',
          right: '8px',
          bottom: '7px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          zIndex: 1,
        }}>
          {/* Emoji button */}
          {enableEmoji && (
            <button
              type="button"
              aria-label="Emoji"
              style={iconBtnStyle}
              onClick={() => setShowEmoji(!showEmoji)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(237, 237, 237)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(248, 248, 248)'}
            >
              {/* Smiley icon - exact LiveChat SVG */}
              <svg viewBox="0 0 32 32" style={{ width: '32px', height: '32px', fill: 'none', flexShrink: 0 }}>
                <g stroke="none" strokeWidth="2" fillRule="evenodd" transform="translate(7, 7)">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M0,9 C0,12.2153905 1.71539025,15.1865338 4.5,16.7942289 C7.28460967,18.4019241 10.7153903,18.4019241 13.5,16.7942289 C16.2846097,15.1865338 18,12.2153905 18,9 C18,5.78460984 16.2846098,2.81346659 13.5,1.2057714 C10.7153903,-0.401923799 7.28460966,-0.401923799 4.5,1.2057714 C1.71539023,2.81346659 0,5.78460984 0,9" />
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M6,7.00000019 L6.01,7.00000019 M12,7.00000019 L12.01,7.00000019" />
                  <path d="M6.5,12.0000002 C7.15831134,12.6718864 8.05935933,13.0505104 9,13.0505104 C9.94064067,13.0505104 10.8416887,12.6718864 11.5,12.0000002" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </button>
          )}

          {/* Voice button */}
          {enableVoice && (window.SpeechRecognition || window.webkitSpeechRecognition) && (
            <button
              type="button"
              aria-label={isListening ? 'Opreste inregistrarea' : 'Vorbeste'}
              style={{
                ...iconBtnStyle,
                color: isListening ? '#ef4444' : 'rgb(17, 17, 17)',
                position: 'relative',
              }}
              onClick={toggleVoice}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(237, 237, 237)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(248, 248, 248)'}
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

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label="Trimite"
            style={{
              display: 'block',
              width: '32px',
              height: '32px',
              padding: 0,
              margin: '0 0 0 2px',
              border: 'none',
              borderRadius: '50%',
              backgroundColor: canSend ? (sendButtonColor || color || 'rgb(17, 17, 17)') : 'rgb(227, 227, 227)',
              color: canSend ? 'rgb(255, 255, 255)' : 'rgb(179, 179, 179)',
              cursor: canSend ? 'pointer' : 'not-allowed',
              outline: 'none',
              flexShrink: 0,
              transition: 'background-color 200ms, color 200ms',
            }}
          >
            {/* Arrow up icon - exact LiveChat SVG */}
            <svg viewBox="0 0 32 32" style={{ width: '32px', height: '32px', fill: 'currentcolor', flexShrink: 0 }}>
              <path d="M16.7071068,8.29289322 L22.7071068,14.2928932 C23.0976311,14.6834175 23.0976311,15.3165825 22.7071068,15.7071068 C22.3466228,16.0675907 21.7793918,16.0953203 21.3871006,15.7902954 L21.2928932,15.7071068 L17,11.414 L17,24 C17,24.5128358 16.6139598,24.9355072 16.1166211,24.9932723 L16,25 C15.4871642,25 15.0644928,24.6139598 15.0067277,24.1166211 L15,24 L15,11.414 L10.7071068,15.7071068 C10.3466228,16.0675907 9.77939176,16.0953203 9.38710056,15.7902954 L9.29289322,15.7071068 C8.93240926,15.3466228 8.90467972,14.7793918 9.20970461,14.3871006 L9.29289322,14.2928932 L15.2928932,8.29289322 C15.6533772,7.93240926 16.2206082,7.90467972 16.6128994,8.20970461 L16.7071068,8.29289322 Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
