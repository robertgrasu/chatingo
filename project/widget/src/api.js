const getConfig = () => window.chatbotConfig || {};

// Generate a unique session ID per browser tab
let _sessionId = null;
export function getSessionId() {
  if (!_sessionId) {
    _sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return _sessionId;
}

export async function fetchWidgetConfig() {
  const { apiUrl, botId } = getConfig();
  try {
    const res = await fetch(`${apiUrl}/api/widget/config/${botId}`);
    return await res.json();
  } catch {
    return {
      welcome_message: 'Bună! Cu ce te pot ajuta?',
      primary_color: '#6366f1',
      position: 'bottom-right',
    };
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
