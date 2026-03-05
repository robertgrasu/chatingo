const getConfig = () => window.chatbotConfig || {};

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
    const data = await res.json();
    // Resolve relative avatar_url to full URL
    if (data.avatar_url && !data.avatar_url.startsWith('http')) {
      data.avatar_url = `${apiUrl}${data.avatar_url}`;
    }
    return data;
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
