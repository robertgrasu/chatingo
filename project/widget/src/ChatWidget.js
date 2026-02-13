import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchWidgetConfig, sendMessage, submitFeedback } from './api';

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
  const [initialized, setInitialized] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const feedbackTimerRef = useRef(null);

  useEffect(() => {
    fetchWidgetConfig().then((cfg) => {
      setConfig((prev) => ({ ...prev, ...cfg }));
    });
  }, []);

  // Feedback inactivity timer
  useEffect(() => {
    if (feedbackSubmitted || showFeedback) return;

    const checkInactivity = () => {
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
  };

  const handleQuickReply = useCallback((text) => {
    handleSend(text);
  }, []);

  const handleFeedback = useCallback((rating, comment = null) => {
    setFeedbackSubmitted(true);
    submitFeedback(rating, comment);
  }, []);

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
