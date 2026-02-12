import React, { useEffect, useState, useRef } from 'react';
import { getWidgetConfig, updateWidgetConfig, uploadAvatar, deleteAvatar } from '../api';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';

function makeGradient(hex) {
  if (!hex || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const r2 = Math.min(255, r + 40);
  const g2 = Math.max(0, g - 30);
  const b2 = Math.min(255, b + 20);
  return `linear-gradient(135deg, rgb(${r},${g},${b}), rgb(${r2},${g2},${b2}))`;
}

function isLightColor(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function Accordion({ title, subtitle, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '500px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-5 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* Professional color picker with preview bar, grid swatches, checkmarks */
function ColorPicker({ value, onChange, presets, gradient = false }) {
  const light = isLightColor(value);
  const textColor = light ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.9)';
  const subColor = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)';

  return (
    <div className="space-y-3">
      {/* Live preview bar */}
      <div
        className="h-12 rounded-xl relative overflow-hidden"
        style={{
          background: gradient ? makeGradient(value) : value,
          border: light ? '1px solid rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <span className="text-xs font-mono font-bold tracking-wider" style={{ color: textColor }}>
            {(value || '').toUpperCase()}
          </span>
          {gradient && (
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: subColor }}>
              Gradient
            </span>
          )}
        </div>
      </div>

      {/* Swatch grid */}
      <div className="grid grid-cols-8 gap-2">
        {presets.map((color) => {
          const selected = value === color;
          const swatchLight = isLightColor(color);
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className={`aspect-square rounded-xl relative transition-all duration-200 ${
                selected
                  ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800 scale-105'
                  : 'hover:scale-110 hover:shadow-md'
              }`}
              style={{
                background: gradient ? makeGradient(color) : color,
                border: swatchLight && !gradient ? '1px solid rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                    stroke={swatchLight && !gradient ? '#000' : '#fff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom color row */}
      <div className="flex items-center gap-2.5 bg-gray-50/80 dark:bg-gray-700/30 rounded-xl px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent flex-shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-mono bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all uppercase tracking-wider"
        />
      </div>
    </div>
  );
}

/* Mini avatar icon reused in previews - supports image URL */
function MiniAvatar({ size = 18, color, iconSize = 8, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

export default function Settings() {
  const { addToast } = useToast();
  const [config, setConfig] = useState({
    welcome_message: '',
    bot_name: 'AI Assistant',
    bot_subtitle: 'AI Agent',
    primary_color: '#6366f1',
    header_color: '#14161a',
    bubble_color: '#ffffff',
    bubble_icon_color: '#14161a',
    bot_message_color: '#f5f5f5',
    avatar_color: '#6366f1',
    avatar_url: null,
    placeholder_text: 'Mesaj...',
    position: 'bottom-right',
    widget_theme: 'default',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  /* ─── Preview interactive state ─── */
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewTyping, setPreviewTyping] = useState(false);
  const previewMsgsRef = useRef(null);
  const botResponseIdx = useRef(0);

  const botResponses = [
    'Multumesc pentru mesaj! Cu ce te pot ajuta?',
    'Am inteles. Pot sa te ajut cu orice intrebare.',
    'Buna observatie! Hai sa discutam.',
    'Sigur, sunt aici sa te ajut!',
  ];

  useEffect(() => {
    getWidgetConfig().then((res) => setConfig(res.data));
  }, []);

  /* Initialize preview messages */
  useEffect(() => {
    const welcome = config.welcome_message || 'Buna! Cu ce te pot ajuta?';
    setPreviewMessages([{ role: 'assistant', content: welcome }]);
  }, [config.welcome_message]);

  /* Auto-scroll preview messages */
  useEffect(() => {
    if (previewMsgsRef.current) {
      previewMsgsRef.current.scrollTop = previewMsgsRef.current.scrollHeight;
    }
  }, [previewMessages, previewTyping]);

  const handlePreviewOpen = () => {
    setPreviewOpen(true);
    if (previewMessages.length === 0) {
      setPreviewMessages([{ role: 'assistant', content: config.welcome_message || 'Buna! Cu ce te pot ajuta?' }]);
    }
  };

  const handlePreviewClose = () => setPreviewOpen(false);

  const handlePreviewSend = () => {
    const text = previewInput.trim();
    if (!text || previewTyping) return;
    setPreviewMessages((prev) => [...prev, { role: 'user', content: text }]);
    setPreviewInput('');
    setPreviewTyping(true);
    setTimeout(() => {
      const response = botResponses[botResponseIdx.current % botResponses.length];
      botResponseIdx.current++;
      setPreviewMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setPreviewTyping(false);
    }, 1200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWidgetConfig(config);
      addToast('Setarile au fost salvate cu succes!', 'success');
    } catch {
      addToast('Eroare la salvarea setarilor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${res.data.avatar_url}`;
      setConfig((prev) => ({ ...prev, avatar_url: url }));
      addToast('Avatar incarcat cu succes!', 'success');
    } catch {
      addToast('Eroare la incarcarea avatarului.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar();
      setConfig((prev) => ({ ...prev, avatar_url: null }));
      addToast('Avatar sters.', 'success');
    } catch {
      addToast('Eroare la stergerea avatarului.', 'error');
    }
  };

  const accentPresets = [
    '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16', '#f59e0b', '#f97316',
    '#ef4444', '#e11d48', '#ec4899', '#d946ef', '#8b5cf6', '#7c3aed', '#06b6d4', '#059669',
  ];
  const headerPresets = [
    '#14161a', '#1e293b', '#1e1b4b', '#172554', '#022c22', '#3f3f46', '#44403c', '#0c0a09',
    '#18181b', '#1f2937', '#312e81', '#1e3a5f', '#064e3b', '#27272a', '#292524', '#ffffff',
  ];
  const bubblePresets = [
    '#ffffff', '#14161a', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#f5f5f4', '#1f2937', '#0ea5e9', '#14b8a6', '#84cc16', '#ec4899', '#7c3aed', '#f97316',
  ];
  const bubbleIconPresets = [
    '#14161a', '#ffffff', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#1f2937', '#f5f5f4', '#0ea5e9', '#14b8a6', '#84cc16', '#ec4899', '#7c3aed', '#f97316',
  ];
  const botMsgPresets = [
    '#f5f5f5', '#e8f4f8', '#f0f0ff', '#fff8e1', '#fce4ec', '#e8f5e9', '#f3e5f5', '#e0f2f1',
    '#f5f5f0', '#e0f7fa', '#ede9fe', '#fef3c7', '#fce7f3', '#d1fae5', '#fae8ff', '#ccfbf1',
  ];
  const avatarPresets = [
    '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16', '#f59e0b', '#f97316',
    '#ef4444', '#e11d48', '#ec4899', '#d946ef', '#8b5cf6', '#7c3aed', '#06b6d4', '#059669',
  ];

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all';

  const pos = config.position === 'bottom-left' ? 'left' : 'right';
  const welcomeMsg = config.welcome_message || 'Buna! Cu ce te pot ajuta?';
  const botName = config.bot_name || 'AI Assistant';
  const botSub = config.bot_subtitle || 'AI Agent';
  const grad = makeGradient(config.primary_color);
  const avatarUrl = config.avatar_url || null;

  /* ─── Classic Preview ─── */
  const renderClassicPreview = () => (
    <>
      {previewOpen && (
        <div
          className="absolute bottom-20 shadow-2xl overflow-hidden flex flex-col"
          style={{ width: '280px', borderRadius: '16px', [pos]: '16px', top: '70px' }}
        >
          <div className="text-white px-4 py-3 text-sm font-semibold flex items-center gap-2.5 flex-shrink-0" style={{ backgroundColor: config.header_color }}>
            <MiniAvatar size={28} color={config.avatar_color} iconSize={12} avatarUrl={avatarUrl} />
            <div>
              <div className={`text-xs font-semibold leading-tight ${config.header_color === '#ffffff' ? 'text-gray-900' : ''}`}>{botName}</div>
              <div className={`text-[10px] leading-tight mt-0.5 ${config.header_color === '#ffffff' ? 'text-gray-400' : 'text-white/50'}`}>{botSub}</div>
            </div>
            <span onClick={handlePreviewClose} className={`ml-auto text-xs cursor-pointer hover:opacity-70 ${config.header_color === '#ffffff' ? 'text-gray-300' : 'text-white/40'}`}>&#x2715;</span>
          </div>
          <div ref={previewMsgsRef} className="bg-white flex-1 overflow-y-auto" style={{ padding: '10px 14px' }}>
            {previewMessages.map((msg, i) =>
              msg.role === 'assistant' ? (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <div className="text-xs p-2.5 rounded-xl rounded-bl-sm inline-block text-gray-700 max-w-[220px]" style={{ backgroundColor: config.bot_message_color || '#f5f5f5' }}>
                    {msg.content}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 ml-0.5">{botName} &middot; Chiar acum</div>
                </div>
              ) : (
                <div key={i} className="flex justify-end" style={{ marginBottom: '8px' }}>
                  <div className="text-xs p-2.5 rounded-xl rounded-br-sm text-white max-w-[180px]" style={{ backgroundColor: config.primary_color }}>
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {previewTyping && (
              <div style={{ marginBottom: '8px' }}>
                <div className="text-xs p-2.5 rounded-xl rounded-bl-sm inline-flex gap-1 items-center" style={{ backgroundColor: config.bot_message_color || '#f5f5f5' }}>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="bg-white border-t border-gray-100 px-3.5 py-2.5 flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
              placeholder={config.placeholder_text || 'Mesaj...'}
              disabled={previewTyping}
              style={{ flex: 1, fontSize: '10px', border: 'none', outline: 'none', background: 'transparent', color: '#374151', fontFamily: 'inherit' }}
            />
            <div onClick={handlePreviewSend} className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" style={{ backgroundColor: config.primary_color }}>
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5A.85.85 0 1111.9 7.6L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601A.85.85 0 112.9 6.399z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      )}
      {/* Bubble */}
      {!previewOpen && (
        <div
          onClick={handlePreviewOpen}
          className="absolute bottom-4 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            backgroundColor: config.bubble_color || '#ffffff',
            [pos]: '16px',
            boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06), 0 2px 32px 0 rgba(0,0,0,0.16)',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 28 32">
            <path fill={config.bubble_icon_color || '#14161a'} d="M28 12.8C28 5.732 21.732 0 14 0S0 5.732 0 12.8c0 5.396 3.592 10.024 8.68 11.88L14 32l5.32-7.32C24.408 22.824 28 18.196 28 12.8zM8 10.4a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm6 0a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm6 0a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z"/>
          </svg>
        </div>
      )}
    </>
  );

  /* ─── LiveChat Preview (faithful to real widget) ─── */
  const renderLiveChatPreview = () => (
    <>
      {previewOpen && (
        <div
          className="absolute bottom-20"
          style={{
            width: '280px', [pos]: '16px', top: '70px',
            padding: '8px',
          }}
        >
          {/* Inner container - matches real widget structure */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%',
            borderRadius: '18px',
            background: 'rgb(246, 246, 247)',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Header overlay zone - floats over messages */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              zIndex: 3, pointerEvents: 'none',
            }}>
              {/* Backdrop blur simulation */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '62px',
                background: 'linear-gradient(to bottom, rgb(246,246,247) 55%, transparent)',
                pointerEvents: 'none',
              }} />

              {/* Top buttons row */}
              <div style={{
                position: 'relative', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 6px 0', pointerEvents: 'auto',
              }}>
                {/* Menu button */}
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgb(221,221,221)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 28 28" style={{ width: '14px', height: '14px', fill: 'rgb(17,17,17)' }}>
                    <path d="M7,16 C8.1045695,16 9,15.1045695 9,14 C9,12.8954305 8.1045695,12 7,12 C5.8954305,12 5,12.8954305 5,14 C5,15.1045695 5.8954305,16 7,16 Z M14,16 C15.1045695,16 16,15.1045695 16,14 C16,12.8954305 15.1045695,12 14,12 C12.8954305,12 12,12.8954305 12,14 C12,15.1045695 12.8954305,16 14,16 Z M21,16 C22.1045695,16 23,15.1045695 23,14 C23,12.8954305 22.1045695,12 21,12 C19.8954305,12 19,12.8954305 19,14 C19,15.1045695 19.8954305,16 21,16 Z" />
                  </svg>
                </div>
                {/* Minimize button - exact icon from widget */}
                <div onClick={handlePreviewClose} style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgb(221,221,221)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <svg viewBox="0 0 28 28" style={{ width: '14px', height: '14px', fill: 'rgb(17,17,17)' }}>
                    <path d="M21,18 C21.5522847,18 22,18.4477153 22,19 C22,19.5522847 21.5522847,20 21,20 L7,20 C6.44771525,20 6,19.5522847 6,19 C6,18.4477153 6.44771525,18 7,18 L21,18 Z" fillRule="nonzero" />
                  </svg>
                </div>
              </div>

              {/* Dynamic Island - Agent Bar */}
              <div style={{
                position: 'absolute', top: '7px', left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '5px 10px', borderRadius: '16px',
                  background: 'white',
                  boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
                  outline: 'rgb(227,227,227) solid 1px', outlineOffset: '-1px',
                  pointerEvents: 'auto',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MiniAvatar size={20} color={config.avatar_color} iconSize={10} avatarUrl={avatarUrl} />
                    <div style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: 'rgb(38, 135, 80)', border: '1.5px solid white',
                    }} />
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'rgb(17,17,17)', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                    {botName}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages area - scrolls under header like real widget */}
            <div ref={previewMsgsRef} style={{
              padding: '58px 12px 8px',
              flex: 1, overflowY: 'auto',
            }}>
              {previewMessages.map((msg, i) => {
                const prevMsg = i > 0 ? previewMessages[i - 1] : null;
                const prevIsSameRole = prevMsg && prevMsg.role === msg.role;

                return msg.role === 'assistant' ? (
                  <div key={i} style={{ display: 'flex', marginBottom: '8px' }}>
                    {!prevIsSameRole ? (
                      <div style={{ marginRight: '6px', flexShrink: 0 }}>
                        <MiniAvatar size={16} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                      </div>
                    ) : (
                      <div style={{ minWidth: '22px' }} />
                    )}
                    <div style={{
                      display: 'inline-block', maxWidth: '180px',
                      background: 'white', borderRadius: '8px', padding: '7px 10px',
                      fontSize: '10px', color: 'rgb(17,17,17)',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row-reverse', marginBottom: '8px' }}>
                    <div style={{
                      display: 'inline-block', maxWidth: '170px',
                      background: config.primary_color, borderRadius: '8px', padding: '7px 10px',
                      fontSize: '10px', color: 'white',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {previewTyping && (
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ marginRight: '6px', flexShrink: 0 }}>
                    <MiniAvatar size={16} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                  </div>
                  <div>
                    <div style={{
                      display: 'inline-flex', gap: '3px', alignItems: 'center',
                      background: 'white', borderRadius: '8px', padding: '8px 12px',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div style={{ fontSize: '8px', color: 'rgb(112,112,112)', marginTop: '2px' }}>
                      {botName} scrie...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area - matches real widget structure */}
            <div style={{ flexShrink: 0, margin: '0 10px' }}>
              <div style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                height: '32px',
              }}>
                {/* + attachment button */}
                <div style={{
                  position: 'absolute', left: '5px', zIndex: 1,
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'rgb(248,248,248)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'rgb(17,17,17)',
                }}>
                  <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                    <path d="M23,15 C23.5522847,15 24,15.4477153 24,16 C24,16.5522847 23.5522847,17 23,17 L17,16.99905 L17.00005,23.00005 C17.00005,23.5523347 16.5523347,24.00005 16.00005,24.00005 C15.4477653,24.00005 15.00005,23.5523347 15.00005,23.00005 L15,16.99905 L9,17 C8.44771525,17 8,16.5522847 8,16 C8,15.4477153 8.44771525,15 9,15 L15,14.99905 L15.00005,9.00005 C15.00005,8.44776525 15.4477653,8.00005 16.00005,8.00005 C16.5523347,8.00005 17.00005,8.44776525 17.00005,9.00005 L17,15 L23,15 Z" />
                  </svg>
                </div>

                {/* Pill input field */}
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                  placeholder={config.placeholder_text || 'Mesaj...'}
                  disabled={previewTyping}
                  style={{
                    width: '100%', height: '32px',
                    padding: '0 56px 0 32px',
                    border: '1px solid rgb(227,227,227)',
                    borderRadius: '20px',
                    background: 'rgb(251,251,251)',
                    fontSize: '9px', fontFamily: 'inherit',
                    color: 'rgb(17,17,17)', outline: 'none',
                    boxShadow: 'rgba(0,0,0,0.075) 0px 0.6px 2.05px -1.33px, rgba(0,0,0,0.067) 0px 2.29px 7.78px -2.67px',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Right buttons: emoji + send */}
                <div style={{
                  position: 'absolute', right: '5px',
                  display: 'flex', alignItems: 'center', gap: '2px', zIndex: 1,
                }}>
                  {/* Emoji button */}
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgb(248,248,248)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'rgb(17,17,17)',
                  }}>
                    <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'none' }}>
                      <g stroke="none" strokeWidth="2" fillRule="evenodd" transform="translate(7, 7)">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M0,9 C0,13.97 4.03,18 9,18 C13.97,18 18,13.97 18,9 C18,4.03 13.97,0 9,0 C4.03,0 0,4.03 0,9" />
                        <path stroke="currentColor" strokeLinecap="round" d="M6,7 L6.01,7 M12,7 L12.01,7" />
                        <path d="M6.5,12 C7.16,12.67 8.06,13.05 9,13.05 C9.94,13.05 10.84,12.67 11.5,12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </div>
                  {/* Send button */}
                  <div onClick={handlePreviewSend} style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: previewInput.trim() ? (config.primary_color || 'rgb(17,17,17)') : 'rgb(227,227,227)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 200ms',
                    color: previewInput.trim() ? 'white' : 'rgb(179,179,179)',
                  }}>
                    <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                      <path d="M16.7071068,8.29289322 L22.7071068,14.2928932 C23.0976311,14.6834175 23.0976311,15.3165825 22.7071068,15.7071068 C22.3466228,16.0675907 21.7793918,16.0953203 21.3871006,15.7902954 L21.2928932,15.7071068 L17,11.414 L17,24 C17,24.5128358 16.6139598,24.9355072 16.1166211,24.9932723 L16,25 C15.4871642,25 15.0644928,24.6139598 15.0067277,24.1166211 L15,24 L15,11.414 L10.7071068,15.7071068 C10.3466228,16.0675907 9.77939176,16.0953203 9.38710056,15.7902954 L9.29289322,15.7071068 C8.93240926,15.3466228 8.90467972,14.7793918 9.20970461,14.3871006 L9.29289322,14.2928932 L15.2928932,8.29289322 C15.6533772,7.93240926 16.2206082,7.90467972 16.6128994,8.20970461 L16.7071068,8.29289322 Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Powered by footer */}
            <div style={{
              flexShrink: 0, textAlign: 'center',
              padding: '4px 0 6px', fontSize: '8px', color: 'rgb(87,87,87)',
            }}>
              Powered by <strong style={{ color: 'rgb(17,17,17)' }}>ChatBot</strong>
            </div>
          </div>
        </div>
      )}

      {/* LiveChat Bubble - matches real widget */}
      {!previewOpen && (
        <div
          onClick={handlePreviewOpen}
          className="absolute bottom-4 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            width: '40px', height: '40px',
            backgroundColor: config.bubble_color || '#fff',
            [pos]: '16px',
            boxShadow: 'rgba(0,0,0,0.125) 0px 0.362176px 0.941657px -1px, rgba(0,0,0,0.18) 0px 3px 7.8px -2px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
              fill={config.bubble_icon_color || '#111'}
            />
          </svg>
        </div>
      )}
    </>
  );

  /* ─── Modern Preview ─── */
  const renderModernPreview = () => (
    <>
      {previewOpen && (
        <div
          className="absolute bottom-20 overflow-hidden flex flex-col"
          style={{
            width: '280px', borderRadius: '16px', [pos]: '16px', top: '70px',
            background: '#ffffff',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* Gradient header */}
          <div style={{
            background: grad, padding: '12px 12px 14px',
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div style={{
                position: 'absolute', bottom: '0px', right: '0px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#22c55e', border: '1.5px solid rgba(255,255,255,0.9)',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '11px', lineHeight: '1.3' }}>{botName}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', lineHeight: '1.3', marginTop: '1px' }}>{botSub}</div>
            </div>
            <div onClick={handlePreviewClose} style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          {/* Messages area */}
          <div ref={previewMsgsRef} style={{ padding: '10px 12px 8px', background: '#f8f9fb', flex: 1, overflowY: 'auto' }}>
            {previewMessages.map((msg, i) =>
              msg.role === 'assistant' ? (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '6px' }}>
                  <MiniAvatar size={18} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                  <div style={{
                    background: '#ffffff', borderRadius: '12px 12px 12px 3px', padding: '7px 10px',
                    fontSize: '10px', color: '#1f2937', maxWidth: '180px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                  <div style={{
                    background: grad, borderRadius: '12px 12px 3px 12px', padding: '7px 10px',
                    fontSize: '10px', color: 'white', maxWidth: '150px',
                  }}>
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {previewTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '6px' }}>
                <MiniAvatar size={18} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                <div style={{
                  background: '#ffffff', borderRadius: '12px 12px 12px 3px', padding: '7px 10px',
                  display: 'flex', gap: '3px', alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ height: '1px', background: '#f0f1f3' }} />

          {/* Input row */}
          <div style={{ padding: '8px 10px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#f0f1f3', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#6b7280', flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </div>
            <div style={{
              flex: 1, height: '26px', borderRadius: '14px',
              border: '1.5px solid #e5e7eb', background: '#f5f5f7',
              display: 'flex', alignItems: 'center', padding: '0 8px',
            }}>
              <input
                type="text"
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                placeholder={config.placeholder_text || 'Mesaj...'}
                disabled={previewTyping}
                style={{ width: '100%', fontSize: '9px', border: 'none', outline: 'none', background: 'transparent', color: '#1f2937', fontFamily: 'inherit' }}
              />
            </div>
            <div onClick={handlePreviewSend} style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: previewInput.trim() ? grad : '#e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, cursor: 'pointer', transition: 'background 200ms',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l7-7 7 7" /><path d="M12 5v14" />
              </svg>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '2px 0 7px', fontSize: '8px', color: '#b0b4ba' }}>
            Powered by <strong style={{ color: '#8b8f96' }}>ChatBot</strong>
          </div>
        </div>
      )}

      {/* Modern Gradient Bubble */}
      {!previewOpen && (
        <div
          onClick={handlePreviewOpen}
          className="absolute bottom-4 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            width: '40px', height: '40px',
            background: grad,
            [pos]: '16px',
            boxShadow: `0 4px 15px ${config.primary_color}66`,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
    </>
  );

  const renderPreview = () => {
    switch (config.widget_theme) {
      case 'livechat': return renderLiveChatPreview();
      case 'modern': return renderModernPreview();
      default: return renderClassicPreview();
    }
  };

  /* ─── Which color sections are relevant per theme ─── */
  const theme = config.widget_theme;
  const showHeaderColor = theme === 'default';
  const showBubbleColors = theme !== 'modern';
  const showBotMsgColor = theme === 'default';

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Settings"
        subtitle="Personalizeaza aspectul si comportamentul widget-ului."
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Accordions */}
        <div className="space-y-3">
          <Accordion
            title="Bot Identity"

            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            defaultOpen
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nume bot</label>
                <input type="text" value={config.bot_name} onChange={(e) => setConfig({ ...config, bot_name: e.target.value })} className={inputClass} placeholder="AI Assistant" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Subtitlu</label>
                <input type="text" value={config.bot_subtitle} onChange={(e) => setConfig({ ...config, bot_subtitle: e.target.value })} className={inputClass} placeholder="AI Agent" />
              </div>
            </div>
          </Accordion>

          <Accordion title="Welcome Message" icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z">
            <textarea value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Scrie mesajul de bun venit..." />
          </Accordion>

          <Accordion title="Accent Color" icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01">
            <ColorPicker
              value={config.primary_color}
              onChange={(c) => setConfig({ ...config, primary_color: c })}
              presets={accentPresets}
              gradient
            />
          </Accordion>

          {showHeaderColor && (
            <Accordion title="Header Color" icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z">
              <ColorPicker
                value={config.header_color}
                onChange={(c) => setConfig({ ...config, header_color: c })}
                presets={headerPresets}
              />
            </Accordion>
          )}

          {showBubbleColors && (
            <Accordion title="Chat Bubble" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare bubble</label>
                  <ColorPicker
                    value={config.bubble_color}
                    onChange={(c) => setConfig({ ...config, bubble_color: c })}
                    presets={bubblePresets}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare icon</label>
                  <ColorPicker
                    value={config.bubble_icon_color}
                    onChange={(c) => setConfig({ ...config, bubble_icon_color: c })}
                    presets={bubbleIconPresets}
                  />
                </div>
              </div>
            </Accordion>
          )}

          <Accordion title="Avatar Bot" icon="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z">
            <div className="space-y-5">
              {/* Avatar image upload */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Imagine avatar / logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-gray-200 dark:border-gray-600" style={{ background: config.avatar_url ? 'transparent' : config.avatar_color }}>
                    {config.avatar_url ? (
                      <img src={config.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <button
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Se incarca...' : 'Incarca imagine'}
                    </button>
                    {config.avatar_url && (
                      <button
                        onClick={handleAvatarDelete}
                        className="px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Sterge imaginea
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">PNG, JPG, GIF, WebP sau SVG. Se foloseste ca avatar in chat.</p>
              </div>
              {/* Fallback color */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare avatar (fallback)</label>
                <ColorPicker
                  value={config.avatar_color}
                  onChange={(c) => setConfig({ ...config, avatar_color: c })}
                  presets={avatarPresets}
                />
              </div>
            </div>
          </Accordion>

          {showBotMsgColor && (
            <Accordion title="Mesaje Bot" icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z">
              <ColorPicker
                value={config.bot_message_color}
                onChange={(c) => setConfig({ ...config, bot_message_color: c })}
                presets={botMsgPresets}
              />
            </Accordion>
          )}

          <Accordion title="Placeholder Text" icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
            <input type="text" value={config.placeholder_text} onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })} className={inputClass} placeholder="Mesaj..." />
          </Accordion>

          <Accordion title="Widget Theme" icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'default', label: 'Classic', desc: 'Designul original cu header colorat' },
                { value: 'livechat', label: 'LiveChat', desc: 'Design modern cu Dynamic Island' },
                { value: 'modern', label: 'Modern', desc: 'Glass design cu gradient si animatii' },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    config.widget_theme === t.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input type="radio" name="widget_theme" value={t.value} checked={config.widget_theme === t.value} onChange={(e) => setConfig({ ...config, widget_theme: e.target.value })} className="sr-only" />
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.widget_theme === t.value ? 'border-primary' : 'border-gray-300 dark:border-gray-500'}`}>
                      {config.widget_theme === t.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-6">{t.desc}</p>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion title="Widget Position" icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bottom-right', label: 'Dreapta jos' },
                { value: 'bottom-left', label: 'Stanga jos' },
              ].map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    config.position === p.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input type="radio" name="position" value={p.value} checked={config.position === p.value} onChange={(e) => setConfig({ ...config, position: e.target.value })} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.position === p.value ? 'border-primary' : 'border-gray-300 dark:border-gray-500'}`}>
                    {config.position === p.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 font-medium shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Se salveaza...
              </>
            ) : 'Salveaza setarile'}
          </button>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="sticky top-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({config.widget_theme === 'livechat' ? 'LiveChat' : config.widget_theme === 'modern' ? 'Modern' : 'Classic'})
              </span>
            </h3>
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl h-[630px] overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Fake browser bar */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 ml-2">your-website.com</div>
              </div>

              {/* Content area */}
              <div className="p-6">
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-2/3" />
              </div>

              {/* Theme-specific preview */}
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
