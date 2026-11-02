import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './ChatWidget';

const style = document.createElement('style');
style.textContent = `
  /* === Default theme animations === */
  @keyframes cw-launcher {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes cw-messenger {
    0% { opacity: 0; transform: scale(0); }
    40% { opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes cw-msg {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cw-dot {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes cw-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .cw-messenger {
    animation: cw-messenger 250ms cubic-bezier(0, 1, 1, 1);
    transform-origin: bottom right;
  }
  .cw-msg { animation: cw-msg 0.2s ease-out; }
  .cw-d1 { animation: cw-dot 1.2s ease-in-out infinite; }
  .cw-d2 { animation: cw-dot 1.2s ease-in-out 0.2s infinite; }
  .cw-d3 { animation: cw-dot 1.2s ease-in-out 0.4s infinite; }

  /* === LiveChat theme animations === */
  @keyframes lc-enter {
    0% { opacity: 0; transform: translate3d(40%, 40%, 0) scale(0.1); }
    100% { opacity: 1; transform: translate3d(0%, 0%, 0) scale(1); }
  }
  @keyframes lc-msg-enter {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .lc-widget {
    animation: lc-enter 430ms cubic-bezier(0.33, 0, 0, 1);
    transform-origin: bottom right;
  }
  .lc-bubble {
    animation: cw-launcher 300ms cubic-bezier(0.33, 0, 0, 1);
  }
  .lc-msg {
    animation: lc-msg-enter 200ms ease-out;
  }

  /* === Global resets === */
  #chatbot-widget-root * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }
  #chatbot-widget-root ::-webkit-scrollbar { width: 4px; }
  #chatbot-widget-root ::-webkit-scrollbar-track { background: transparent; }
  #chatbot-widget-root ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
`;
document.head.appendChild(style);

const container = document.createElement('div');
container.id = 'chatbot-widget-root';
document.body.appendChild(container);
createRoot(container).render(React.createElement(ChatWidget));
