// Support both enterprise format (window.AiChat.c) and legacy (window.chatbotConfig)
const getConfig = () => {
  const ac = window.AiChat;
  if (ac && ac.c) return { botId: ac.c.id, apiUrl: ac.c.server };
  const legacy = window.chatbotConfig || {};
  return { botId: legacy.botId, apiUrl: legacy.apiUrl };
};

// Generate cryptographically secure session ID (128-bit entropy)
let _sessionId = null;
export function getSessionId() {
  if (!_sessionId) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    _sessionId = 'sess_' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return _sessionId;
}

export async function fetchWidgetConfig() {
  const { apiUrl, botId } = getConfig();
  try {
    const res = await fetch(`${apiUrl}/api/widget/config/${botId}`);
    if (res.status === 403) return null; // Domain not authorized — widget won't render
    const data = await res.json();
    // Resolve relative avatar_url to full URL
    if (data.avatar_url && !data.avatar_url.startsWith('http')) {
      data.avatar_url = `${apiUrl}${data.avatar_url}`;
    }
    return data;
  } catch {
    return null; // Network error or blocked — don't show widget
  }
}

export async function sendMessage(message, image = null) {
  const { apiUrl, botId } = getConfig();
  const body = {
    message,
    bot_id: botId,
    session_id: getSessionId(),
  };
  if (image) {
    body.image = image;
  }
  const res = await fetch(`${apiUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return await res.json();
}

// ── WebSocket for Live Chat ─────────────────────────────────
let _ws = null;
let _wsMessageHandler = null;
let _reconnectTimer = null;
let _wsConnected = false;

export function connectWebSocket(onMessage) {
  const { apiUrl, botId } = getConfig();
  const wsUrl = apiUrl.replace(/^http/, 'ws');
  _wsMessageHandler = onMessage;

  _ws = new WebSocket(`${wsUrl}/ws/chat/${botId}/${getSessionId()}`);

  _ws.onopen = () => {
    _wsConnected = true;
  };

  _ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      _wsMessageHandler?.(data);
    } catch {}
  };

  _ws.onclose = () => {
    _wsConnected = false;
    _reconnectTimer = setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  _ws.onerror = () => {};

  return _ws;
}

export function sendWsMessage(data) {
  if (_ws && _ws.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify(data));
  }
}

export function disconnectWebSocket() {
  clearTimeout(_reconnectTimer);
  _wsConnected = false;
  if (_ws) {
    _ws.onclose = null; // prevent reconnect
    _ws.close();
    _ws = null;
  }
}

export function isWsConnected() {
  return _wsConnected;
}

export async function submitFeedback(rating, comment = null) {
  const { apiUrl, botId } = getConfig();
  try {
    const body = { session_id: getSessionId(), bot_id: botId, rating };
    if (comment) body.comment = comment;
    await fetch(`${apiUrl}/api/chat/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Silently fail - feedback is not critical
  }
}
