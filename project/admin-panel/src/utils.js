// Backend stores UTC without 'Z' suffix - ensure JS parses as UTC
function toUTC(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z');
}

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - toUTC(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Chiar acum';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Ieri';
  return `${days} zile`;
}

export function formatDate(iso) {
  if (!iso) return '';
  return toUTC(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return toUTC(iso).toLocaleString('ro-RO');
}

export function formatTime(iso) {
  if (!iso) return '';
  return toUTC(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}
