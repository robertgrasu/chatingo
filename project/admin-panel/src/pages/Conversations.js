import React, { useEffect, useState, useCallback } from 'react';
import { getConversations, getConversation, deleteConversation, deleteAllConversations } from '../api';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { ConversationSkeleton, MessageSkeleton } from '../components/Skeleton';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';
import { timeAgo } from '../utils';

const PER_PAGE_OPTIONS = [15, 30, 50];

export default function Conversations() {
  const { addToast } = useToast();
  const { selectedBotId } = useBot();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadConversations = useCallback(() => {
    setLoading(true);
    getConversations({ page, per_page: perPage, sort: sortBy, search: searchQuery, bot_id: selectedBotId })
      .then((res) => {
        setConversations(res.data.items);
        setTotalItems(res.data.total);
        setTotalPages(res.data.pages);
      })
      .catch(() => addToast('Eroare la incarcarea conversatiilor.', 'error'))
      .finally(() => setLoading(false));
  }, [page, perPage, sortBy, searchQuery, selectedBotId, addToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectConversation = (conv) => {
    setSelected(conv.id);
    setLoadingDetail(true);
    getConversation(conv.id)
      .then((res) => setDetail(res.data))
      .finally(() => setLoadingDetail(false));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      open: true,
      title: 'Sterge conversatia',
      message: 'Sigur vrei sa stergi aceasta conversatie? Aceasta actiune nu poate fi anulata.',
      onConfirm: async () => {
        await deleteConversation(id);
        if (selected === id) {
          setSelected(null);
          setDetail(null);
        }
        addToast('Conversatie stearsa.', 'success');
        loadConversations();
      },
    });
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      open: true,
      title: 'Sterge TOATE conversatiile',
      message: `Sigur vrei sa stergi toate cele ${totalItems} conversatii? Aceasta actiune nu poate fi anulata.`,
      onConfirm: async () => {
        await deleteAllConversations(selectedBotId);
        setSelected(null);
        setDetail(null);
        addToast('Toate conversatiile au fost sterse.', 'success');
        setPage(1);
        loadConversations();
      },
    });
  };

  const handleSort = (newSort) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handlePerPage = (newPerPage) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const sortOptions = [
    { value: 'newest', label: 'Cele mai noi' },
    { value: 'oldest', label: 'Cele mai vechi' },
    { value: 'most_messages', label: 'Cele mai multe mesaje' },
  ];

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Conversatii"
        subtitle={`${totalItems} conversatii in total`}
        action={
          totalItems > 0 && (
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Sterge toate
            </button>
          )
        }
      />

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left: Conversation List */}
        <div className="col-span-1 bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          {/* Header controls */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cauta conversatii..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Sort + per page */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={perPage}
                onChange={(e) => handlePerPage(Number(e.target.value))}
                className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-16"
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation list - scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <>
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
                <ConversationSkeleton />
              </>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">{searchQuery ? 'Niciun rezultat' : 'Nicio conversatie inca'}</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-all duration-150 group ${
                    selected === conv.id ? 'bg-primary/10 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {timeAgo(conv.last_message_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                        {conv.message_count} msg
                      </span>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                    {conv.first_message || 'Conversatie noua'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    Sesiune: {conv.session_id.slice(0, 12)}...
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-gray-400">
                Pag. {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Prima pagina"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Pagina anterioara"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Pagina urmatoare"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Ultima pagina"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Conversation Detail */}
        <div className="col-span-2 bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
          {!detail && !loadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm font-medium">Selecteaza o conversatie</p>
              <p className="text-xs mt-1">Click pe o conversatie din lista</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <MessageSkeleton align="left" />
              <MessageSkeleton align="right" />
              <MessageSkeleton align="left" />
              <MessageSkeleton align="right" />
            </div>
          ) : detail && (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Conversatie
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(detail.started_at).toLocaleString('ro-RO')} &middot; {detail.message_count} mesaje
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(null); setDetail(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Inchide"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages - scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {detail.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.image_url && (
                        <img
                          src={`http://localhost:8000${msg.image_url}`}
                          alt="attachment"
                          className="max-w-full rounded-lg mb-2"
                          style={{ maxHeight: '200px' }}
                        />
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        msg.role === 'user' ? 'text-white/50' : 'text-gray-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
