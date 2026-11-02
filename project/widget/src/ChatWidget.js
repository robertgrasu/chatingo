import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchWidgetConfig, sendMessage, submitFeedback, connectWebSocket, sendWsMessage, disconnectWebSocket } from './api';

// Default theme (current)
import DefaultBubble from './components/ChatBubble';
import DefaultWindow from './components/ChatWindow';

// LiveChat theme
import LiveChatBubble from './themes/livechat/ChatBubble';
import LiveChatWindow from './themes/livechat/ChatWindow';

// Modern theme
import ModernBubble from './themes/modern/ChatBubble';
import ModernWindow from './themes/modern/ChatWindow';

const themes = {
  default: { Bubble: DefaultBubble, Window: DefaultWindow },
  livechat: { Bubble: LiveChatBubble, Window: LiveChatWindow },
  modern: { Bubble: ModernBubble, Window: ModernWindow },
};

const FEEDBACK_DELAY = 45000; // 45 seconds inactivity
const MIN_MESSAGES_FOR_FEEDBACK = 4; // 2 exchanges (user+assistant each)

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    welcome_message: 'Bună! Cu ce te pot ajuta?',
    bot_name: 'AI Assistant',
    bot_subtitle: 'AI Agent',
    primary_color: '#6366f1',
    header_color: '#14161a',
    bubble_color: '#ffffff',
    bubble_icon_color: '#14161a',
    bot_message_color: '#f5f5f5',
    avatar_color: '#6366f1',
    avatar_url: null,
    gradient_end_color: null,
    gradient_angle: 135,
    placeholder_text: 'Mesaj...',
    position: 'bottom-right',
    widget_theme: 'default',
    show_online_status: true,
    show_subtitle: true,
    enable_emoji: true,
    enable_attachments: true,
    enable_voice: false,
    send_button_color: null,
    user_message_color: null,
    bubble_icon: 'chat',
    avatar_size: 42,
    quick_replies: null,
  });
  const [blocked, setBlocked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [chatMode, setChatMode] = useState('bot'); // bot, waiting, live, closed
  const [operatorName, setOperatorName] = useState(null);
  const [operatorTyping, setOperatorTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [liveChatEnabled, setLiveChatEnabled] = useState(false);
  const wsRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const feedbackTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleWsMessage = useCallback((data) => {
    lastActivityRef.current = Date.now();

    switch (data.type) {
      case 'bot_message':
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.content, senderType: 'bot', time: Date.now() },
        ]);
        break;

      case 'operator_message':
        setOperatorTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.content, senderType: 'operator', operatorName: data.operator_name, time: Date.now() },
        ]);
        break;

      case 'escalation_suggestion':
        setMessages((prev) => [
          ...prev,
          { role: 'escalation', operatorsOnline: data.operators_online, time: Date.now() },
        ]);
        break;

      case 'waiting_for_operator':
        setChatMode('waiting');
        setMessages((prev) => {
          // Don't add duplicate waiting message
          if (prev.some((m) => m.role === 'system' && m.content === 'Se cauta un operator disponibil...'))
            return prev;
          return [
            ...prev,
            { role: 'system', content: 'Se cauta un operator disponibil...', time: Date.now() },
          ];
        });
        break;

      case 'operator_connected':
        setChatMode('live');
        setOperatorName(data.operator_name);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `Esti acum conectat cu ${data.operator_name}.`, time: Date.now() },
        ]);
        break;

      case 'operator_typing':
        setOperatorTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOperatorTyping(false), 3000);
        break;

      case 'conversation_closed':
        setChatMode('closed');
        setOperatorName(null);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Operatorul a incheiat conversatia.', time: Date.now() },
        ]);
        break;

      case 'transferred_to_bot':
        setChatMode('bot');
        setOperatorName(null);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Ati fost transferat inapoi la asistentul AI.', time: Date.now() },
        ]);
        break;

      case 'operator_disconnected':
        setChatMode('waiting');
        setOperatorName(null);
        setOperatorTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Operatorul s-a deconectat. Se cauta alt operator...', time: Date.now() },
        ]);
        break;

      case 'show_contact_form':
        setShowContactForm(true);
        break;

      case 'contact_form_submitted':
        setShowContactForm(false);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: 'Formularul a fost trimis! Vom reveni in curand.', time: Date.now() },
        ]);
        break;
    }
  }, []);

  useEffect(() => {
    fetchWidgetConfig().then((cfg) => {
      if (!cfg) {
        setBlocked(true); // Domain not authorized — stay invisible
        return;
      }
      setConfig((prev) => ({ ...prev, ...cfg }));
      if (cfg.enable_live_chat) {
        setLiveChatEnabled(true);
        connectWebSocket(handleWsMessage);
      }
    });
    return () => {
      disconnectWebSocket();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [handleWsMessage]);

  // Feedback inactivity timer
  useEffect(() => {
    if (feedbackSubmitted || showFeedback) return;

    const checkInactivity = () => {
      // Don't show feedback during active live chat
      if (chatMode === 'live' || chatMode === 'waiting') return;

      const realMessages = messages.filter((m) => m.role !== 'feedback');
      if (
        realMessages.length >= MIN_MESSAGES_FOR_FEEDBACK &&
        Date.now() - lastActivityRef.current >= FEEDBACK_DELAY &&
        !feedbackSubmitted
      ) {
        setShowFeedback(true);
        setMessages((prev) => [
          ...prev,
          { role: 'feedback', time: Date.now() },
        ]);
      }
    };

    feedbackTimerRef.current = setInterval(checkInactivity, 5000);
    return () => clearInterval(feedbackTimerRef.current);
  }, [messages.length, feedbackSubmitted, showFeedback]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!initialized) {
      setMessages([{ role: 'assistant', content: config.welcome_message, time: Date.now() }]);
      setInitialized(true);
      lastActivityRef.current = Date.now();
    }
  };

  const handleSend = async (text, imageData = null) => {
    setShowQuickReplies(false);
    lastActivityRef.current = Date.now();

    const userMsg = { role: 'user', content: text, time: Date.now(), image: imageData };
    setMessages((prev) => [...prev, userMsg]);

    if (liveChatEnabled) {
      // WebSocket mode
      if (chatMode !== 'live') {
        setIsLoading(true);
      }
      sendWsMessage({ type: 'message', content: text });
    } else {
      // HTTP mode (no live chat)
      setIsLoading(true);
      try {
        const data = await sendMessage(text, imageData);
        lastActivityRef.current = Date.now();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response, time: Date.now() },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Scuze, a apărut o eroare. Încearcă din nou.',
            time: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRequestHuman = useCallback(() => {
    // Remove escalation card so it can't be clicked again
    setMessages((prev) => prev.filter((m) => m.role !== 'escalation'));
    sendWsMessage({ type: 'request_human' });
  }, []);

  const handleDismissEscalation = useCallback(() => {
    // Remove escalation message
    setMessages((prev) => prev.filter((m) => m.role !== 'escalation'));
  }, []);

  const handleContactSubmit = useCallback((formData) => {
    sendWsMessage({ type: 'contact_form', ...formData });
  }, []);

  const handleQuickReply = useCallback((text) => {
    handleSend(text);
  }, []);

  // Throttled typing indicator — send at most once every 2s
  const lastTypingSent = useRef(0);
  const handleInputChange = useCallback(() => {
    if (chatMode === 'live' && Date.now() - lastTypingSent.current > 2000) {
      lastTypingSent.current = Date.now();
      sendWsMessage({ type: 'typing' });
    }
  }, [chatMode]);

  const handleFeedback = useCallback((rating, comment = null) => {
    setFeedbackSubmitted(true);
    submitFeedback(rating, comment);
  }, []);

  // Domain not authorized — render nothing
  if (blocked) return null;

  // Parse quick replies
  let quickReplies = [];
  try {
    if (config.quick_replies) {
      quickReplies = JSON.parse(config.quick_replies);
    }
  } catch {
    quickReplies = [];
  }

  // Only show quick replies when just welcome message is visible
  const realMessages = messages.filter((m) => m.role !== 'feedback');
  const shouldShowQuickReplies = showQuickReplies && quickReplies.length > 0 && realMessages.length <= 1;

  // Select theme components
  const theme = themes[config.widget_theme] || themes.default;
  const { Bubble, Window } = theme;

  return (
    <>
      {isOpen && (
        <Window
          messages={messages}
          onSend={handleSend}
          onClose={() => setIsOpen(false)}
          isLoading={isLoading}
          color={config.primary_color}
          headerColor={config.header_color}
          botName={config.bot_name}
          botSubtitle={config.bot_subtitle}
          botMessageColor={config.bot_message_color}
          avatarColor={config.avatar_color}
          avatarUrl={config.avatar_url}
          gradientEndColor={config.gradient_end_color}
          gradientAngle={config.gradient_angle}
          placeholderText={config.placeholder_text}
          position={config.position}
          showOnlineStatus={config.show_online_status}
          showSubtitle={config.show_subtitle}
          enableEmoji={config.enable_emoji}
          enableAttachments={config.enable_attachments}
          enableVoice={config.enable_voice}
          sendButtonColor={config.send_button_color}
          userMessageColor={config.user_message_color}
          avatarSize={config.avatar_size}
          quickReplies={shouldShowQuickReplies ? quickReplies : []}
          onQuickReply={handleQuickReply}
          onFeedback={handleFeedback}
          feedbackSubmitted={feedbackSubmitted}
          chatMode={chatMode}
          operatorName={operatorName}
          operatorTyping={operatorTyping}
          showContactForm={showContactForm}
          onRequestHuman={handleRequestHuman}
          onDismissEscalation={handleDismissEscalation}
          onContactSubmit={handleContactSubmit}
          onInputChange={handleInputChange}
          liveChatEnabled={liveChatEnabled}
        />
      )}
      <Bubble
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        color={config.primary_color}
        bubbleColor={config.bubble_color}
        bubbleIconColor={config.bubble_icon_color}
        gradientEndColor={config.gradient_end_color}
        gradientAngle={config.gradient_angle}
        position={config.position}
        isOpen={isOpen}
        bubbleIcon={config.bubble_icon}
      />
    </>
  );
}
