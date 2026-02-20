import React, { useState } from 'react';
import { useBot } from '../BotContext';
import { createBot, deleteBot } from '../api';
import { useToast } from '../ToastContext';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { formatDate } from '../utils';

export default function Bots() {
  const { bots, selectedBotId, selectBot, refreshBots, loading } = useBot();
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ bot_name: '', welcome_message: 'Buna! Cu ce te pot ajuta?', primary_color: '#6366f1' });

  const handleCreate = async () => {
    if (!form.bot_name.trim()) return;
    setCreating(true);
    try {
      const res = await createBot(form);
      addToast(`Bot "${form.bot_name}" creat cu succes`, 'success');
      selectBot(res.data.bot_id);
      refreshBots();
      setShowCreate(false);
      setForm({ bot_name: '', welcome_message: 'Buna! Cu ce te pot ajuta?', primary_color: '#6366f1' });
    } catch {
      addToast('Eroare la crearea botului', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBot(deleteTarget.bot_id);
      addToast(`Bot "${deleteTarget.bot_name}" sters`, 'success');
      if (selectedBotId === deleteTarget.bot_id) {
        const remaining = bots.filter((b) => b.bot_id !== deleteTarget.bot_id);
        if (remaining.length > 0) selectBot(remaining[0].bot_id);
      }
      refreshBots();
    } catch {
      addToast('Eroare la stergerea botului', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const colors = ['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

  return (
    <div>
      <PageHeader
        title="Botii Mei"
        subtitle="Gestioneaza chatbotii tai"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Bot Nou
          </button>
        }
      />

      {/* Create Bot Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-light rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Creeaza un Bot Nou</h3>
              <p className="text-sm text-gray-400 mt-1">Configureaza-l apoi din Settings</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Numele Botului</label>
                <input
                  type="text"
                  value={form.bot_name}
                  onChange={(e) => setForm({ ...form, bot_name: e.target.value })}
                  placeholder="ex: Support Bot, Sales Assistant..."
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-dark focus:border-primary outline-none transition-colors text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mesaj de Bun Venit</label>
                <textarea
                  value={form.welcome_message}
                  onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-dark focus:border-primary outline-none transition-colors resize-none text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Culoare Principala</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, primary_color: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${form.primary_color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-dark' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.bot_name.trim()}
                className="px-5 py-2.5 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {creating ? 'Se creeaza...' : 'Creeaza Bot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bot Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded mb-4" />
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bots.map((bot) => (
            <div
              key={bot.bot_id}
              onClick={() => selectBot(bot.bot_id)}
              className={`bg-white dark:bg-dark-light border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 group ${
                bot.bot_id === selectedBotId
                  ? 'border-primary shadow-lg shadow-primary/10'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: bot.primary_color || '#6366f1' }}>
                    {(bot.bot_name || 'B')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{bot.bot_name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{bot.bot_id}</p>
                  </div>
                </div>
                {bot.bot_id === selectedBotId && (
                  <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">Activ</span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {bot.document_count} documente
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {bot.conversation_count} conversatii
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">{formatDate(bot.created_at)}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(bot); }}
                  className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Sterge bot"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Sterge Bot"
        message={`Sigur vrei sa stergi "${deleteTarget?.bot_name}"? Toate datele asociate (documente, conversatii, feedback) vor fi sterse permanent.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
