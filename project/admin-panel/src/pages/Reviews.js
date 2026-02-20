import React, { useEffect, useState, useCallback } from 'react';
import { getFeedback, getConversation } from '../api';
import { useBot } from '../BotContext';
import PageHeader from '../components/PageHeader';
import { MessageSkeleton } from '../components/Skeleton';
import { timeAgo } from '../utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'oldest', label: 'Cele mai vechi' },
  { value: 'highest', label: 'Rating maxim' },
  { value: 'lowest', label: 'Rating minim' },
];

function Stars({ rating, size = 'w-3.5 h-3.5' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${size} ${s <= rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { selectedBotId } = useBot();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState(null);

  // Conversation detail
  const [selectedFb, setSelectedFb] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadFeedback = useCallback(() => {
    setLoading(true);
    const params = { page, per_page: perPage, sort: sortBy, bot_id: selectedBotId };
    if (ratingFilter !== null) params.rating_filter = ratingFilter;
    getFeedback(params)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [page, perPage, sortBy, ratingFilter, selectedBotId]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

  const handleViewConversation = (fb) => {
    setSelectedFb(fb);
    setDetail(null);
    if (!fb.conversation_id) return;
    setLoadingDetail(true);
    getConversation(fb.conversation_id)
      .then((res) => setDetail(res.data))
      .finally(() => setLoadingDetail(false));
  };

  const avgRating = data?.average_rating || 0;
  const totalRatings = data?.total_ratings || 0;
  const distribution = data?.rating_distribution || {};
  const satisfied = ((distribution['4'] || 0) + (distribution['5'] || 0));
  const satisfactionPct = totalRatings > 0 ? Math.round((satisfied / totalRatings) * 100) : 0;

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Recenzii"
        subtitle="Feedback si evaluari de la utilizatori cu context conversational."
        breadcrumbs={[{ label: 'Recenzii' }]}
      />

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : totalRatings === 0 ? (
        /* Empty state */
        <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Nicio recenzie inca</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Evaluarile vor aparea aici dupa ce utilizatorii interactioneaza cu chatbot-ul si lasa feedback.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Rating Mediu</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgRating}</p>
                <span className="text-sm text-gray-400">/ 5</span>
              </div>
              <div className="mt-2"><Stars rating={Math.round(avgRating)} /></div>
            </div>

            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Total Evaluari</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRatings}</p>
              <p className="text-xs text-gray-400 mt-2">din conversatii</p>
            </div>

            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Satisfactie</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{satisfactionPct}%</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">evaluari de 4-5 stele</p>
            </div>
          </div>

          {/* Individual Reviews: List + Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}>
            {/* Left: Reviews List */}
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
              {/* Controls */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3 flex-shrink-0">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full text-xs bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors text-gray-700 dark:text-gray-300"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Rating filter pills */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => { setRatingFilter(null); setPage(1); }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      ratingFilter === null
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Toate
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRatingFilter(ratingFilter === r ? null : r); setPage(1); }}
                      className={`text-[11px] px-2 py-1 rounded-lg font-medium flex items-center gap-0.5 transition-colors ${
                        ratingFilter === r
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {r}
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
                        <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : !data?.items?.length ? (
                  <div className="flex-1 flex items-center justify-center py-12 text-gray-400 text-sm">
                    Nicio recenzie gasita
                  </div>
                ) : (
                  data.items.map((fb) => (
                    <div
                      key={fb.id}
                      onClick={() => handleViewConversation(fb)}
                      className={`p-4 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-all duration-150 group ${
                        selectedFb?.id === fb.id
                          ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Stars rating={fb.rating} size="w-3 h-3" />
                        <span className="text-[10px] text-gray-400">{timeAgo(fb.created_at)}</span>
                      </div>
                      {fb.comment && (
                        <p className="text-sm text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
                          &ldquo;{fb.comment}&rdquo;
                        </p>
                      )}
                      {fb.first_message ? (
                        <p className="text-xs text-gray-400 truncate italic">
                          {fb.first_message}
                        </p>
                      ) : !fb.conversation_id ? (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">fara conversatie</span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
                  <span className="text-[11px] text-gray-400">{data.total} recenzii</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
                      {page} / {data.pages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(data.pages, page + 1))}
                      disabled={page >= data.pages}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Conversation Detail */}
            <div className="col-span-2 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
              {!selectedFb ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <svg className="w-16 h-16 mb-3 text-amber-200 dark:text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-sm font-medium">Selecteaza o recenzie</p>
                  <p className="text-xs mt-1">Click pe o recenzie pentru a vedea conversatia</p>
                </div>
              ) : loadingDetail ? (
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <MessageSkeleton align="left" />
                  <MessageSkeleton align="right" />
                  <MessageSkeleton align="left" />
                  <MessageSkeleton align="right" />
                </div>
              ) : !selectedFb.conversation_id ? (
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Stars rating={selectedFb.rating} size="w-4 h-4" />
                      <span className="text-xs text-gray-400">{timeAgo(selectedFb.created_at)}</span>
                    </div>
                    <button
                      onClick={() => { setSelectedFb(null); setDetail(null); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* No conversation */}
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <p className="text-sm">Conversatia nu mai exista</p>
                    <p className="text-xs mt-1">Feedback-ul a fost trimis fara o conversatie asociata</p>
                  </div>
                  {/* Comment footer */}
                  {selectedFb.comment && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-500/5 flex-shrink-0">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Comentariu</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">&ldquo;{selectedFb.comment}&rdquo;</p>
                    </div>
                  )}
                </div>
              ) : detail && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                    <div>
                      <div className="flex items-center gap-3 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversatie</p>
                        <Stars rating={selectedFb.rating} size="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(detail.started_at).toLocaleString('ro-RO')} &middot; {detail.message_count} mesaje
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedFb(null); setDetail(null); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Messages */}
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

                  {/* Feedback comment footer */}
                  {selectedFb.comment && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-500/5 flex-shrink-0">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Comentariu feedback</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">&ldquo;{selectedFb.comment}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
