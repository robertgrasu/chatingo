import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getBots } from './api';

const BotContext = createContext();

export function BotProvider({ children }) {
  const [selectedBotId, setSelectedBotId] = useState(() => {
    return localStorage.getItem('selectedBotId') || 'bot_123';
  });
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBots = useCallback(() => {
    getBots()
      .then((res) => {
        const list = res.data.bots || [];
        setBots(list);
        const botIds = list.map((b) => b.bot_id);
        if (botIds.length > 0 && !botIds.includes(selectedBotId)) {
          setSelectedBotId(botIds[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBots();
  }, [loadBots]);

  useEffect(() => {
    localStorage.setItem('selectedBotId', selectedBotId);
  }, [selectedBotId]);

  const selectBot = (botId) => setSelectedBotId(botId);

  return (
    <BotContext.Provider value={{ selectedBotId, selectBot, bots, loading, refreshBots: loadBots }}>
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  return useContext(BotContext);
}
