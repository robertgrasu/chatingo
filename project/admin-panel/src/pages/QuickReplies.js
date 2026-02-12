import React, { useEffect, useState } from 'react';
import { getWidgetConfig, updateWidgetConfig } from '../api';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';

export default function QuickReplies() {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const toast = useToast();

  useEffect(() => {
    getWidgetConfig().then((res) => {
      setConfig(res.data);
      try {
        const parsed = JSON.parse(res.data.quick_replies || '[]');
        setReplies(parsed);
      } catch {
        setReplies([]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty replies
      const cleaned = replies.filter((r) => r.trim() !== '');
      await updateWidgetConfig({ quick_replies: JSON.stringify(cleaned) });
      setReplies(cleaned);
      toast.success('Raspunsurile rapide au fost salvate!');
    } catch {
      toast.error('Eroare la salvare.');
    } finally {
      setSaving(false);
    }
  };

  const addReply = () => {
    if (replies.length >= 8) return;
    setReplies([...replies, '']);
  };

  const updateReply = (index, value) => {
    const updated = [...replies];
    updated[index] = value;
    setReplies(updated);
  };

  const removeReply = (index) => {
    setReplies(replies.filter((_, i) => i !== index));
  };

  const moveReply = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= replies.length) return;
    const updated = [...replies];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setReplies(updated);
  };

  const primaryColor = config?.primary_color || '#6366f1';

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Raspunsuri Rapide"
        subtitle="Configureaza optiunile de raspuns rapid afisate in widget."
        breadcrumbs={[{ label: 'Raspunsuri Rapide' }]}
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium text-sm transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Se salveaza...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salveaza
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info card */}
          <div className="bg-primary/5 border-2 border-primary/10 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Cum functioneaza?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Raspunsurile rapide apar ca butoane sub mesajul de bun venit. Cand utilizatorul apasa pe unul, textul este trimis automat ca mesaj. Dispar dupa primul mesaj trimis.
              </p>
            </div>
          </div>

          {/* Replies list */}
          <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Raspunsuri configurate</h3>
                <p className="text-xs text-gray-400 mt-0.5">{replies.length}/8 raspunsuri</p>
              </div>
              {replies.length < 8 && (
                <button
                  onClick={addReply}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Adauga
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Niciun raspuns rapid configurat</p>
                <p className="text-xs text-gray-400 mt-1">Adauga raspunsuri pentru a le afisa in widget</p>
                <button
                  onClick={addReply}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Adauga primul raspuns
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {replies.map((reply, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Order number */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                      {i + 1}
                    </span>

                    {/* Input */}
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => updateReply(i, e.target.value)}
                      placeholder="Scrie raspunsul..."
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary outline-none transition-colors text-gray-900 dark:text-white"
                      maxLength={50}
                    />

                    {/* Move up/down */}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveReply(i, -1)}
                        disabled={i === 0}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveReply(i, 1)}
                        disabled={i === replies.length - 1}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeReply(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add button at bottom */}
            {replies.length > 0 && replies.length < 8 && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={addReply}
                  className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  + Adauga raspuns
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <div className="sticky top-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </h3>
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Simulated chat header */}
              <div className="px-4 py-3 bg-gray-900 text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold">{config?.bot_name || 'AI Assistant'}</p>
                  <p className="text-[10px] text-white/50">{config?.bot_subtitle || 'AI Agent'}</p>
                </div>
              </div>

              {/* Welcome message */}
              <div className="p-4 bg-white dark:bg-dark min-h-[200px]">
                <div className="flex items-start gap-2 mb-3">
                  <div className="max-w-[85%] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                    <p className="text-xs text-gray-700 dark:text-gray-300">{config?.welcome_message || 'Buna! Cu ce te pot ajuta?'}</p>
                  </div>
                </div>

                {/* Quick reply pills preview */}
                {replies.filter((r) => r.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {replies.filter((r) => r.trim()).map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-3 py-1 rounded-full border-[1.5px] font-medium cursor-default transition-colors hover:text-white"
                        style={{
                          borderColor: primaryColor,
                          color: primaryColor,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = primaryColor; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = primaryColor; }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulated input */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400">
                  {config?.placeholder_text || 'Mesaj...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
