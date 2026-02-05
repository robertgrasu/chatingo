import React, { useEffect, useState } from 'react';
import { fetchWidgetConfig, sendMessage } from './api';
import ChatBubble from './components/ChatBubble';
import ChatWindow from './components/ChatWindow';

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
    placeholder_text: 'Mesaj...',
    position: 'bottom-right',
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchWidgetConfig().then((cfg) => {
      setConfig(cfg);
    });
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (!initialized) {
      setMessages([{ role: 'assistant', content: config.welcome_message, time: Date.now() }]);
      setInitialized(true);
    }
  };

  const handleSend = async (text, imageData = null) => {
    const userMsg = { role: 'user', content: text, time: Date.now(), image: imageData };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await sendMessage(text, imageData);
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

  return (
    <>
      {isOpen && (
        <ChatWindow
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
          placeholderText={config.placeholder_text}
          position={config.position}
        />
      )}
      <ChatBubble
        onClick={() => isOpen ? setIsOpen(false) : handleOpen()}
        color={config.primary_color}
        bubbleColor={config.bubble_color}
        bubbleIconColor={config.bubble_icon_color}
        position={config.position}
        isOpen={isOpen}
      />
    </>
  );
}
