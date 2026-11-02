import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getConversations } from '../api';
import { useBot } from '../BotContext';
import PageHeader from '../components/PageHeader';
import { timeAgo } from '../utils';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentConvs, setRecentConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { selectedBotId } = useBot();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getStats(selectedBotId).then((res) => setStats(res.data)),
      getConversations({ per_page: 5, bot_id: selectedBotId }).then((res) => setRecentConvs(res.data.items || res.data || [])),
    ]).finally(() => setLoading(false));
  }, [selectedBotId]);

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Privire de ansamblu asupra sistemului."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Documente"
              value={stats.total_documents}
              sub="in knowledge base"
              color="primary"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path opacity="0.3" d="M16 2H8C5.79 2 4 3.79 4 6v12c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4z" fill="currentColor"/>
                  <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatCard
              label="Categorii"
              value={stats.total_categories}
              sub="active"
              color="purple"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path opacity="0.3" d="M2 6.5C2 4.01 4.01 2 6.5 2H9c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6.5zM13 4c0-1.1.9-2 2-2h2.5C19.99 2 22 4.01 22 6.5V9c0 1.1-.9 2-2 2h-5c-1.1 0-2-.9-2-2V4zM2 15c0-1.1.9-2 2-2h5c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H6.5C4.01 22 2 19.99 2 17.5V15zM13 15c0-1.1.9-2 2-2h5c1.1 0 2 .9 2 2v2.5c0 2.49-2.01 4.5-4.5 4.5H15c-1.1 0-2-.9-2-2v-5z" fill="currentColor"/>
                </svg>
              }
            />
            <StatCard
              label="Conversatii"
              value={stats.total_conversations}
              change={stats.conversations_today}
              color="success"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path opacity="0.3" d="M18 14c0 4.418-3.582 8-8 8-1.236 0-2.406-.28-3.45-.78-.36-.172-.767-.232-1.151-.13l-1.227.328c-.966.259-1.85-.625-1.591-1.591l.328-1.227c.103-.384.042-.79-.13-1.15A7.96 7.96 0 012 14c0-4.418 3.582-8 8-8s8 3.582 8 8z" fill="currentColor"/>
                  <path d="M17.984 14.508c.108-.045.214-.092.319-.142.292-.14.622-.189.934-.105l.996.266c.786.21 1.504-.508 1.294-1.294l-.266-.996c-.084-.312-.035-.643.105-.935A5.97 5.97 0 0022 8.5C22 4.91 19.09 2 15.5 2 12.79 2 10.467 3.659 9.492 6.016" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              }
            />
            <StatCard
              label="Mesaje"
              value={stats.total_messages}
              change={stats.messages_today}
              color="warning"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path opacity="0.3" d="M2 6c0-1.886 0-2.828.586-3.414C3.172 2 4.114 2 6 2h12c1.886 0 2.828 0 3.414.586C22 3.172 22 4.114 22 6v8c0 1.886 0 2.828-.586 3.414C20.828 18 19.886 18 18 18H6c-1.886 0-2.828 0-3.414-.586C2 16.828 2 15.886 2 14V6z" fill="currentColor"/>
                  <path d="M8 22h8M12 18v4M8 10h8M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Activity Chart + Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Activity Chart */}
        <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Activitate ultimele 7 zile</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-[10px] text-gray-400">Mesaje</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple" />
                <span className="text-[10px] text-gray-400">Conversatii</span>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 flex flex-col min-h-0">
            {loading || !stats?.daily ? (
              <div className="flex items-end gap-3 flex-1 min-h-[10rem]">
                {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t animate-pulse" style={{ height: `${h}%` }} />
                    <div className="h-2 w-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <ActivityChart daily={stats.daily} />
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Conversatii recente</h3>
            <button
              onClick={() => navigate('/conversations')}
              className="text-xs text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium"
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
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-dark-lighter transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {conv.first_message || 'Conversatie noua'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(conv.last_message_at)}</p>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-dark-lighter px-2 py-0.5 rounded-full flex-shrink-0">{conv.message_count} msg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/knowledge')}
          className="group flex items-center gap-4 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-left hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14m-7-7h14" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Adauga document</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Upload in knowledge base</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/conversations')}
          className="group flex items-center gap-4 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-left hover:border-purple/30 dark:hover:border-purple/30 hover:shadow-lg hover:shadow-purple/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversatii</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Vezi istoric chat</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="group flex items-center gap-4 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-left hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg hover:shadow-gray-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Setari widget</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Personalizeaza aspect</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/integration')}
          className="group flex items-center gap-4 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 text-left hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Integrare</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Cod embed pentru site</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function ActivityChart({ daily }) {
  const maxVal = Math.max(...daily.map((d) => d.messages), 1);
  const dayNames = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam'];

  return (
    <div className="flex gap-2 flex-1 min-h-[9rem]">
      {daily.map((day, i) => {
        const msgH = maxVal > 0 ? (day.messages / maxVal) * 100 : 0;
        const convH = maxVal > 0 ? (day.conversations / maxVal) * 100 : 0;
        const dateObj = new Date(day.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];
        const isToday = i === daily.length - 1;

        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
            {/* Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-dark-lighter text-white text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              <div className="font-medium">{day.messages} mesaje, {day.conversations} conv</div>
              <div className="text-gray-400">{day.date}</div>
            </div>

            {/* Bars */}
            <div className="w-full flex items-end justify-center gap-0.5 flex-1">
              <div
                className={`w-[45%] rounded-t transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-primary/40 dark:bg-primary/30'}`}
                style={{ height: `${Math.max(msgH, 4)}%` }}
              />
              <div
                className={`w-[45%] rounded-t transition-all duration-500 ${isToday ? 'bg-purple' : 'bg-purple/40 dark:bg-purple/30'}`}
                style={{ height: `${Math.max(convH, 4)}%` }}
              />
            </div>

            <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-gray-400'}`}>
              {isToday ? 'Azi' : dayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, change, color, icon }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    purple: 'bg-purple/10 text-purple',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-success',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-warning',
  };

  return (
    <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      {change > 0 ? (
        <div className="flex items-center gap-1 mt-1.5">
          <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="text-xs font-medium text-success">+{change} astazi</span>
        </div>
      ) : sub ? (
        <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
      ) : (
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5">0 astazi</p>
      )}
    </div>
  );
}

