import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getConversations } from '../api';
import PageHeader from '../components/PageHeader';
import { timeAgo } from '../utils';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentConvs, setRecentConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getStats().then((res) => setStats(res.data)),
      getConversations({ per_page: 5 }).then((res) => setRecentConvs(res.data.items || res.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Privire de ansamblu asupra sistemului."
        breadcrumbs={[{ label: 'Dashboard' }]}
        action={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Online
          </span>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden mb-8">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6">
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <StatCell label="Documente" value={stats.total_documents} sub="in knowledge base" />
            <StatCell label="Categorii" value={stats.total_categories} sub="active" />
            <StatCell
              label="Conversatii"
              value={stats.total_conversations}
              change={stats.conversations_today}
            />
            <StatCell
              label="Mesaje"
              value={stats.total_messages}
              change={stats.messages_today}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Conversatii recente</h3>
            <button
              onClick={() => navigate('/conversations')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Vezi toate &rarr;
            </button>
          </div>
          {recentConvs.length === 0 && !loading ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Nicio conversatie inca</p>
            </div>
          ) : (
            <div>
              {recentConvs.map((conv, i) => (
                <div
                  key={conv.id}
                  onClick={() => navigate('/conversations')}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                >
                  <span className="text-xs text-gray-300 dark:text-gray-600 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {conv.first_message || 'Conversatie noua'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{conv.message_count} msg</span>
                  <span className="text-xs text-gray-300 dark:text-gray-500 flex-shrink-0">{timeAgo(conv.last_message_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Actiuni rapide</h3>
          </div>
          <div className="p-3 space-y-1">
            <ActionItem
              onClick={() => navigate('/knowledge')}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
              label="Adauga document"
              desc="Upload in knowledge base"
              color="text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
            />
            <ActionItem
              onClick={() => navigate('/conversations')}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />}
              label="Conversatii"
              desc="Vezi istoric chat"
              color="text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10"
            />
            <ActionItem
              onClick={() => navigate('/settings')}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
              label="Setari widget"
              desc="Personalizeaza aspect"
              color="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
            />
            <ActionItem
              onClick={() => navigate('/integration')}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
              label="Integrare"
              desc="Cod embed pentru site"
              color="text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, sub, change }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 dark:text-white tabular-nums">{value}</p>
      {change > 0 ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">+{change} astazi</p>
      ) : sub ? (
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      ) : (
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">0 astazi</p>
      )}
    </div>
  );
}

function ActionItem({ onClick, icon, label, desc, color }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
