import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useBot } from '../BotContext';
import { useToast } from '../ToastContext';
import {
  connectOperatorWs, getLiveChatConversations, getLiveChatMessages,
  getContactSubmissions, markContactRead, deleteContact,
} from '../api';
import PageHeader from '../components/PageHeader';
import { timeAgo } from '../utils';

// ── Helpers ────────────────────────────────────────────

function toUTC(dateStr) {
  if (!dateStr) return null;
  let s = String(dateStr);
  if (s.includes('+') && s.endsWith('Z')) s = s.slice(0, -1);
  if (!s.endsWith('Z') && !s.includes('+') && !s.includes('T00:00:00')) s = s + 'Z';
  return new Date(s);
}

function formatTime(dateStr) {
  const d = toUTC(dateStr);
  return d && !isNaN(d) ? d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : '';
}

function formatDate(dateStr) {
  const d = toUTC(dateStr);
  return d && !isNaN(d) ? d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
}

// Tiny inline notification beep (base64-encoded short beep)
const BEEP_DATA = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACA' +
  'f39/f4CAgICAgH9/f3+AgICAgIB/f39/gICAgICAgH9/f3+AgICAgIB/f39/gICBgYGBgH9+fn5/' +
  'gIGBgYGAf35+fn+AgYGBgYB/fn5+f4CBgYGBgH9+fn5/gIGCgoGAf35+fn+AgYKCgYB/fn5+f4CB' +
  'goKBgH9+fn5/gIGCgoKBf35+fn6AgYKCgoF/fn5+foCBgoOCgX9+fX1+gIGDg4KBf31+fn6AgYOD' +
  'g4F/fX19foCBg4SDgX99fX1+gIGEhIOBf319fX6AgYSEhIF/fH19foCBhIWEgX99fX1+gIGEhYSB' +
  'f319fH2AgYWFhIF+fHx9foCChYaFgn58fH1+gIKFhoWCfnx8fX6AgoaGhYJ+fHt9foCChoaGgn58' +
  'fH1+gIKGh4aCfnx8fH6AgoaHhoJ+fHx8fYCChoiHgn58e3x9gIKHiIeCfnx7fH2AgoiIh4J+fHt8' +
  'fYCCiImIgn57e3x9gIOIiYiCfnt7fH2Ag4mJiIJ+e3t8fYCDiYqJg358e3t9gIOJiomDfnt7e32A' +
  'g4qKiYN+e3t7fYCDiouKg358ent9gIOKi4qDfnt6e32Ag4uLioN+e3p7fYCDi4yLg358ent8gIOL' +
  'jIuDfnt6e3yAg4uMjIN+e3p7fICDjI2Mg358enp8gISMjYyDfnp6e3yAhIyNjIN+enp7fICEjY2M' +
  'g356ent8gISNjo2Dfnp6enyAhI2OjYR+enp6fICEjo6NhH56enp8gISNjo2Efnp6enyAhI6PjoR+' +
  'eXl6fICEjo+OhH56eXp8gISPj46Efnl5enyAhI+Qj4R9eXl6e4CEj5CPhH15eXp7gIWQkI+EfXl5' +
  'enuAhZCQj4R9eXl6e4CFkJGQhH15eHp7gIWQkZCEfXl4enuAhZCRkIR9eXh6e4CFkZGQhH14eHp7';

function playNotificationSound() {
  try { new Audio(BEEP_DATA).play().catch(() => {}); } catch {}
}

// ── Canned responses ───────────────────────────────────

const CANNED_RESPONSES = [
  { label: 'Salut', text: 'Buna ziua! Cu ce va pot ajuta?' },
  { label: 'Asteptati', text: 'Va rog asteptati un moment, verific informatiile.' },
  { label: 'Multumesc', text: 'Va multumesc! Mai aveti si alte intrebari?' },
  { label: 'Inchidere', text: 'Ma bucur ca am putut ajuta! O zi buna!' },
  { label: 'Transfer', text: 'O sa va transfer catre un coleg specializat.' },
  { label: 'Revenire', text: 'Revin imediat cu un raspuns.' },
];

// ── Main component ─────────────────────────────────────

export default function LiveChat() {
  const { accessToken } = useAuth();
  const { currentBot } = useBot();
  const { addToast } = useToast();

  // Tab: 'chat' | 'contacts'
  const [activeTab, setActiveTab] = useState('chat');

  // Chat state
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [showCanned, setShowCanned] = useState(false);

  // Contact submissions
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectRef = useRef(null);
  const visitorTypingTimeout = useRef(null);
  const textareaRef = useRef(null);

  // Handle WS messages — use ref to avoid stale closure
  const handleWsMessageRef = useRef(null);
  const handleWsMessage = useCallback((data) => {
    switch (data.type) {
      case 'init':
        setConversations(data.conversations || []);
        break;

      case 'new_waiting_conversation':
        setConversations(prev => {
          const exists = prev.find(c => c.conversation_id === data.conversation_id);
          if (exists) {
            return prev.map(c => c.conversation_id === data.conversation_id ? { ...c, status: 'waiting' } : c);
          }
          return [data, ...prev];
        });
        playNotificationSound();
        if (Notification.permission === 'granted') {
          new Notification('Live Chat', { body: `Vizitator nou asteapta: ${data.preview?.slice(0, 50) || '...'}` });
        }
        break;

      case 'visitor_message':
        setVisitorTyping(false);
        setMessages(prev => [...prev, {
          role: 'user', content: data.content,
          sender_type: 'user', created_at: data.created_at,
        }]);
        setConversations(prev => prev.map(c =>
          c.conversation_id === data.conversation_id
            ? { ...c, last_message_at: data.created_at, message_count: (c.message_count || 0) + 1 }
            : c
        ));
        playNotificationSound();
        break;

      case 'visitor_typing':
        setVisitorTyping(true);
        clearTimeout(visitorTypingTimeout.current);
        visitorTypingTimeout.current = setTimeout(() => setVisitorTyping(false), 3000);
        break;

      case 'conversation_accepted':
        setConversations(prev => prev.map(c =>
          c.conversation_id === data.conversation_id
            ? { ...c, status: 'live', operator_id: data.operator_id, operator_name: data.operator_name }
            : c
        ));
        break;

      case 'conversation_closed_update':
      case 'conversation_transferred':
        setConversations(prev => prev.filter(c => c.conversation_id !== data.conversation_id));
        if (selected === data.conversation_id) {
          setSelected(null);
          setMessages([]);
        }
        break;
    }
  }, [selected]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, visitorTyping]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  handleWsMessageRef.current = handleWsMessage;

  // Keep accessToken in a ref
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  // Connect WebSocket
  const connectWs = useCallback(() => {
    const token = accessTokenRef.current;
    if (!token) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = connectOperatorWs(
      token,
      (data) => handleWsMessageRef.current?.(data),
      () => {
        setWsConnected(false);
        reconnectRef.current = setTimeout(connectWs, 3000);
      }
    );

    ws.onopen = () => setWsConnected(true);
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      clearTimeout(reconnectRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connectWs]);

  // Polling fallback
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await getLiveChatConversations();
        const items = res.data?.items || [];
        if (items.length > 0) {
          setConversations(prev => {
            const map = new Map(prev.map(c => [c.conversation_id || c.id, c]));
            for (const item of items) {
              const key = item.conversation_id || item.id;
              const existing = map.get(key);
              if (!existing) map.set(key, { ...item, conversation_id: key });
              else if (existing.status !== item.status) map.set(key, { ...existing, ...item, conversation_id: key });
            }
            return Array.from(map.values()).sort((a, b) =>
              new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
            );
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  // Load contacts
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await getContactSubmissions();
      setContacts(res.data?.items || []);
    } catch {}
    setContactsLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') loadContacts();
  }, [activeTab, loadContacts]);

  // Load messages when selecting conversation
  const handleSelectConversation = async (convId) => {
    setSelected(convId);
    try {
      const res = await getLiveChatMessages(convId);
      setMessages(res.data.messages || []);
    } catch { setMessages([]); }
  };

  // Operator typing — throttled
  const lastOperatorTyping = useRef(0);
  const handleOperatorTyping = () => {
    if (selected && wsRef.current && Date.now() - lastOperatorTyping.current > 2000) {
      lastOperatorTyping.current = Date.now();
      wsRef.current.send(JSON.stringify({ type: 'typing', conversation_id: selected }));
    }
  };

  // Send message
  const handleSend = () => {
    if (!input.trim() || !selected || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: 'message', conversation_id: selected, content: input.trim(),
    }));
    setMessages(prev => [...prev, {
      role: 'assistant', content: input.trim(),
      sender_type: 'operator', created_at: new Date().toISOString(),
    }]);
    setInput('');
    setShowCanned(false);
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Canned response insert
  const handleCannedResponse = (text) => {
    setInput(text);
    setShowCanned(false);
    textareaRef.current?.focus();
  };

  // Accept / Close / Transfer
  const handleAccept = (convId) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'accept_conversation', conversation_id: convId }));
    setConversations(prev => prev.map(c =>
      c.conversation_id === convId ? { ...c, status: 'live' } : c
    ));
    handleSelectConversation(convId);
  };

  const handleClose = (convId) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'close_conversation', conversation_id: convId }));
    setConversations(prev => prev.filter(c => c.conversation_id !== convId));
    if (selected === convId) { setSelected(null); setMessages([]); }
  };

  const handleTransferToBot = (convId) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'transfer_to_bot', conversation_id: convId }));
    setConversations(prev => prev.filter(c => c.conversation_id !== convId));
    if (selected === convId) { setSelected(null); setMessages([]); }
  };

  // Contact actions
  const handleMarkRead = async (id) => {
    try {
      await markContactRead(id);
      setContacts(prev => prev.map(c => c.id === id ? { ...c, status: 'read' } : c));
    } catch { addToast('Eroare', 'error'); }
  };

  const handleDeleteContact = async (id) => {
    try {
      await deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      if (selectedContact?.id === id) setSelectedContact(null);
      addToast('Formular sters', 'success');
    } catch { addToast('Eroare la stergere', 'error'); }
  };

  // Filter by current bot
  const filteredConvs = conversations.filter(c => !currentBot || c.bot_id === currentBot.bot_id);
  const waitingConvs = filteredConvs.filter(c => c.status === 'waiting');
  const activeConvs = filteredConvs.filter(c => c.status === 'live');
  const selectedConv = filteredConvs.find(c => c.conversation_id === selected);

  const filteredContacts = useMemo(() =>
    contacts.filter(c => !currentBot || c.bot_id === currentBot.bot_id),
    [contacts, currentBot]
  );
  const unreadContacts = filteredContacts.filter(c => c.status === 'new').length;

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    handleOperatorTyping();
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Live Chat"
        subtitle="Conversatii in timp real cu vizitatorii"
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {wsConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Conversatii
          {(waitingConvs.length + activeConvs.length) > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">
              {waitingConvs.length + activeConvs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'contacts'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Formulare contact
          {unreadContacts > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">
              {unreadContacts}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'chat' ? (
        /* ══════ CHAT TAB ══════ */
        <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Left: Conversation list */}
          <div className="w-80 flex-shrink-0 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {/* Waiting section */}
            {waitingConvs.length > 0 && (
              <div className="flex-shrink-0">
                <div className="px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  In asteptare ({waitingConvs.length})
                </div>
                {waitingConvs.map(conv => (
                  <ConversationItem
                    key={conv.conversation_id}
                    conv={conv}
                    isSelected={selected === conv.conversation_id}
                    onSelect={() => handleSelectConversation(conv.conversation_id)}
                    onAccept={() => handleAccept(conv.conversation_id)}
                    isWaiting
                  />
                ))}
              </div>
            )}

            {/* Active section */}
            <div className="flex-1 overflow-y-auto">
              {activeConvs.length > 0 && (
                <div>
                  <div className="px-4 py-2.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Active ({activeConvs.length})
                  </div>
                  {activeConvs.map(conv => (
                    <ConversationItem
                      key={conv.conversation_id}
                      conv={conv}
                      isSelected={selected === conv.conversation_id}
                      onSelect={() => handleSelectConversation(conv.conversation_id)}
                    />
                  ))}
                </div>
              )}

              {filteredConvs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-6 text-center">
                  <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm font-medium">Nicio conversatie activa</p>
                  <p className="text-xs mt-1 leading-relaxed">Vizitatorii vor aparea aici cand solicita asistenta umana</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Chat view */}
          <div className="flex-1 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {selected && selectedConv ? (
              <>
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(selectedConv.session_id || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Vizitator #{selectedConv.session_id?.slice(-6)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{selectedConv.message_count} mesaje</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span>Inceput {formatDate(selectedConv.started_at)}</span>
                        {selectedConv.status === 'live' && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Live
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedConv.status === 'waiting' && (
                      <button
                        onClick={() => handleAccept(selected)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Accepta
                      </button>
                    )}
                    {selectedConv.status === 'live' && (
                      <>
                        <button
                          onClick={() => handleTransferToBot(selected)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="Transfera conversatia inapoi la bot"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          Bot
                        </button>
                        <button
                          onClick={() => handleClose(selected)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          title="Inchide conversatia"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          Inchide
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} msg={msg} />
                  ))}
                  {visitorTyping && (
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs py-1">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Vizitatorul scrie...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                {selectedConv.status === 'live' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {/* Canned responses dropdown */}
                    {showCanned && (
                      <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
                        {CANNED_RESPONSES.map((cr, i) => (
                          <button
                            key={i}
                            onClick={() => handleCannedResponse(cr.text)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            title={cr.text}
                          >
                            {cr.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="p-3 flex gap-2 items-end">
                      <button
                        onClick={() => setShowCanned(!showCanned)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          showCanned
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        title="Raspunsuri rapide"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </button>
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleTextareaChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                        }}
                        placeholder="Scrie un mesaj... (Shift+Enter pt linie noua)"
                        rows={1}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-none"
                        style={{ maxHeight: '120px' }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        title="Trimite (Enter)"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="w-20 h-20 mb-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Selecteaza o conversatie</p>
                <p className="text-xs mt-1.5 text-gray-400">sau asteapta un vizitator nou</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ══════ CONTACTS TAB ══════ */
        <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Left: Contact list */}
          <div className="w-96 flex-shrink-0 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Formulare primite ({filteredContacts.length})
              </span>
              {unreadContacts > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadContacts} necitite
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                <div className="p-6 text-center text-gray-400 text-sm">Se incarca...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-6 text-center">
                  <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Niciun formular de contact</p>
                  <p className="text-xs mt-1">Vor aparea aici cand vizitatorii trimit formulare</p>
                </div>
              ) : (
                filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact);
                      if (contact.status === 'new') handleMarkRead(contact.id);
                    }}
                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors group ${
                      selectedContact?.id === contact.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {contact.status === 'new' && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {contact.visitor_name || 'Anonim'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{timeAgo(contact.created_at)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-all"
                          title="Sterge"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.visitor_email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{contact.message?.slice(0, 80)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Contact detail */}
          <div className="flex-1 bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {selectedContact ? (
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {selectedContact.visitor_name || 'Anonim'}
                    </h3>
                    <a href={`mailto:${selectedContact.visitor_email}`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                      {selectedContact.visitor_email}
                    </a>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(selectedContact.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`mailto:${selectedContact.visitor_email}`}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Raspunde
                    </a>
                    <button
                      onClick={() => handleDeleteContact(selectedContact.id)}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      Sterge
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Mesaj</div>
                  <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {selectedContact.message}
                  </p>
                </div>
                {selectedContact.session_id && (
                  <div className="mt-4 text-[11px] text-gray-400">
                    Sesiune: {selectedContact.session_id?.slice(0, 16)}... | Bot: {selectedContact.bot_id}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="w-20 h-20 mb-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium">Selecteaza un formular</p>
                <p className="text-xs mt-1.5 text-gray-400">pentru a vedea detaliile</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Conversation list item ─────────────────────────────

function ConversationItem({ conv, isSelected, onSelect, onAccept, isWaiting }) {
  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
            isWaiting ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
          }`}>
            {(conv.session_id || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block truncate">
              Vizitator #{conv.session_id?.slice(-6)}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {conv.message_count || 0} mesaje
            </span>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
          {timeAgo(conv.last_message_at || conv.started_at)}
        </span>
      </div>
      {conv.preview && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate ml-9">
          {conv.preview}
        </p>
      )}
      {isWaiting && onAccept && (
        <button
          onClick={(e) => { e.stopPropagation(); onAccept(); }}
          className="mt-2 ml-9 px-3 py-1 bg-green-600 text-white text-[10px] font-semibold rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Accepta
        </button>
      )}
    </div>
  );
}

// ── Chat message bubble ────────────────────────────────

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.sender_type === 'system';
  const isOperator = msg.sender_type === 'operator';

  if (isSystem) {
    return (
      <div className="text-center py-2">
        <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mr-2 mt-1">
          V
        </div>
      )}
      <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
          : isOperator
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-br-sm'
      }`}>
        {!isUser && (
          <div className={`text-[10px] font-semibold mb-0.5 ${
            isOperator ? 'text-indigo-200' : 'text-blue-500 dark:text-blue-400'
          }`}>
            {isOperator ? 'Tu (Operator)' : 'Bot AI'}
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
        <div className={`text-[10px] mt-1 ${
          isUser ? 'text-gray-400' : isOperator ? 'text-indigo-200' : 'text-blue-400'
        }`}>
          {formatTime(msg.created_at)}
        </div>
      </div>
      {isOperator && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ml-2 mt-1">
          O
        </div>
      )}
    </div>
  );
}
