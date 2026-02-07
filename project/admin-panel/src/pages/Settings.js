import React, { useEffect, useState } from 'react';
import { getWidgetConfig, updateWidgetConfig } from '../api';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';

function Accordion({ title, subtitle, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
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
        <div className="px-5 pb-5 pt-0">
          {children}
        </div>
      </div>
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
    placeholder_text: 'Mesaj...',
    position: 'bottom-right',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWidgetConfig().then((res) => setConfig(res.data));
  }, []);

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

  const presetColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const presetHeaderColors = ['#14161a', '#1e293b', '#1e1b4b', '#172554', '#022c22', '#3f3f46', '#44403c', '#ffffff'];
  const presetBubbleColors = ['#ffffff', '#14161a', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];
  const presetBotMsgColors = ['#f5f5f5', '#e8f4f8', '#f0f0ff', '#fff8e1', '#fce4ec', '#e8f5e9', '#f3e5f5', '#e0f2f1'];
  const presetAvatarColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all';

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
            subtitle="Numele si descrierea botului"
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

          <Accordion title="Welcome Message" subtitle="Mesajul afisat la deschiderea chat-ului" icon="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z">
            <textarea value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Scrie mesajul de bun venit..." />
          </Accordion>

          <Accordion title="Accent Color" subtitle="Culoarea bulelor utilizator si buton send" icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01">
            <div className="flex items-center gap-2.5 mb-3">
              {presetColors.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, primary_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.primary_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={config.primary_color} onChange={(e) => setConfig({ ...config, primary_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
              <input type="text" value={config.primary_color} onChange={(e) => setConfig({ ...config, primary_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
          </Accordion>

          <Accordion title="Header Color" subtitle="Culoarea header-ului chat-ului" icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z">
            <div className="flex items-center gap-2.5 mb-3">
              {presetHeaderColors.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, header_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.header_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'} ${color === '#ffffff' ? 'border border-gray-200 dark:border-gray-600' : ''}`} style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={config.header_color} onChange={(e) => setConfig({ ...config, header_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
              <input type="text" value={config.header_color} onChange={(e) => setConfig({ ...config, header_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
          </Accordion>

          <Accordion title="Chat Bubble" subtitle="Culoarea butonului de chat" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Culoare bubble</label>
                <div className="flex items-center gap-2.5 mb-3">
                  {presetBubbleColors.map((color) => (
                    <button key={color} onClick={() => setConfig({ ...config, bubble_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.bubble_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'} ${color === '#ffffff' ? 'border border-gray-200 dark:border-gray-600' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.bubble_color} onChange={(e) => setConfig({ ...config, bubble_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
                  <input type="text" value={config.bubble_color} onChange={(e) => setConfig({ ...config, bubble_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Culoare icon bubble</label>
                <div className="flex items-center gap-2.5 mb-3">
                  {['#14161a', '#ffffff', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'].map((color) => (
                    <button key={color} onClick={() => setConfig({ ...config, bubble_icon_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.bubble_icon_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'} ${color === '#ffffff' ? 'border border-gray-200 dark:border-gray-600' : ''}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.bubble_icon_color} onChange={(e) => setConfig({ ...config, bubble_icon_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
                  <input type="text" value={config.bubble_icon_color} onChange={(e) => setConfig({ ...config, bubble_icon_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion title="Avatar Bot" subtitle="Culoarea avatarului din header" icon="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z">
            <div className="flex items-center gap-2.5 mb-3">
              {presetAvatarColors.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, avatar_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.avatar_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={config.avatar_color} onChange={(e) => setConfig({ ...config, avatar_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
              <input type="text" value={config.avatar_color} onChange={(e) => setConfig({ ...config, avatar_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
          </Accordion>

          <Accordion title="Mesaje Bot" subtitle="Culoarea bulelor de mesaj bot" icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z">
            <div className="flex items-center gap-2.5 mb-3">
              {presetBotMsgColors.map((color) => (
                <button key={color} onClick={() => setConfig({ ...config, bot_message_color: color })} className={`w-8 h-8 rounded-full transition-all duration-200 ${config.bot_message_color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color, border: '1px solid #e5e7eb' }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={config.bot_message_color} onChange={(e) => setConfig({ ...config, bot_message_color: e.target.value })} className="w-10 h-10 border-0 rounded-lg cursor-pointer" />
              <input type="text" value={config.bot_message_color} onChange={(e) => setConfig({ ...config, bot_message_color: e.target.value })} className="border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm w-28 font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
          </Accordion>

          <Accordion title="Placeholder Text" subtitle="Textul din caseta de mesaj" icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
            <input type="text" value={config.placeholder_text} onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })} className={inputClass} placeholder="Mesaj..." />
          </Accordion>

          <Accordion title="Widget Position" subtitle="Pozitia widget-ului pe pagina" icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bottom-right', label: 'Dreapta jos' },
                { value: 'bottom-left', label: 'Stanga jos' },
              ].map((pos) => (
                <label
                  key={pos.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    config.position === pos.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input type="radio" name="position" value={pos.value} checked={config.position === pos.value} onChange={(e) => setConfig({ ...config, position: e.target.value })} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.position === pos.value ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-500'}`}>
                    {config.position === pos.value && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pos.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2"
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
            </h3>
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl h-[480px] overflow-hidden border border-gray-200 dark:border-gray-700">
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

              {/* Mini chat window */}
              <div
                className="absolute bottom-20 shadow-2xl overflow-hidden"
                style={{
                  width: '280px',
                  borderRadius: '16px',
                  [config.position === 'bottom-left' ? 'left' : 'right']: '16px',
                }}
              >
                <div className="text-white px-4 py-3 text-sm font-semibold flex items-center gap-2.5" style={{ backgroundColor: config.header_color }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: config.avatar_color || '#6366f1' }}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold leading-tight ${config.header_color === '#ffffff' ? 'text-gray-900' : ''}`}>{config.bot_name || 'AI Assistant'}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${config.header_color === '#ffffff' ? 'text-gray-400' : 'text-white/50'}`}>{config.bot_subtitle || 'AI Agent'}</div>
                  </div>
                  <span className={`ml-auto text-xs cursor-pointer ${config.header_color === '#ffffff' ? 'text-gray-300' : 'text-white/40'}`}>&#x2715;</span>
                </div>
                <div className="bg-white p-3.5">
                  <div className="text-xs p-2.5 rounded-xl rounded-bl-sm inline-block text-gray-700 max-w-[220px]" style={{ backgroundColor: config.bot_message_color || '#f5f5f5' }}>
                    {config.welcome_message || 'Buna! Cu ce te pot ajuta?'}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 ml-0.5">{config.bot_name || 'AI Assistant'} &middot; {config.bot_subtitle || 'AI Agent'} &middot; Chiar acum</div>
                  <div className="flex justify-end mt-2">
                    <div className="text-xs p-2.5 rounded-xl rounded-br-sm text-white max-w-[180px]" style={{ backgroundColor: config.primary_color }}>
                      Salut, am o intrebare!
                    </div>
                  </div>
                </div>
                <div className="bg-white border-t border-gray-100 px-3.5 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-300">{config.placeholder_text || 'Mesaj...'}</span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primary_color }}>
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5A.85.85 0 1111.9 7.6L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601A.85.85 0 112.9 6.399z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mini bubble */}
              <div
                className="absolute bottom-4 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: config.bubble_color || '#ffffff',
                  [config.position === 'bottom-left' ? 'left' : 'right']: '16px',
                  boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06), 0 2px 32px 0 rgba(0,0,0,0.16)',
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 28 32">
                  <path fill={config.bubble_icon_color || '#14161a'} d="M28 12.8C28 5.732 21.732 0 14 0S0 5.732 0 12.8c0 5.396 3.592 10.024 8.68 11.88L14 32l5.32-7.32C24.408 22.824 28 18.196 28 12.8zM8 10.4a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm6 0a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zm6 0a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
