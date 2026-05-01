// lib/AppContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, DEFAULT_DEALS, DEFAULT_CONTACTS, AGENT_PROFILE_DEFAULT } from './storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [agentProfile, setAgentProfile] = useState(AGENT_PROFILE_DEFAULT);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeDealId, setActiveDealId] = useState(null);
  const [aiMode, setAiMode] = useState('executive'); // executive | transaction | listing
  const [chatHistory, setChatHistory] = useState({}); // keyed by mode
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const savedDeals = storage.get('deals');
    const savedContacts = storage.get('contacts');
    const savedProfile = storage.get('agentProfile');
    const savedMode = storage.get('aiMode');

    setDeals(savedDeals || DEFAULT_DEALS);
    setContacts(savedContacts || DEFAULT_CONTACTS);
    setAgentProfile(savedProfile || AGENT_PROFILE_DEFAULT);
    if (savedMode) setAiMode(savedMode);
    setIsLoaded(true);
  }, []);

  // Persist deals
  useEffect(() => {
    if (isLoaded) storage.set('deals', deals);
  }, [deals, isLoaded]);

  // Persist contacts
  useEffect(() => {
    if (isLoaded) storage.set('contacts', contacts);
  }, [contacts, isLoaded]);

  // Persist profile
  useEffect(() => {
    if (isLoaded) storage.set('agentProfile', agentProfile);
  }, [agentProfile, isLoaded]);

  // Persist mode
  useEffect(() => {
    if (isLoaded) storage.set('aiMode', aiMode);
  }, [aiMode, isLoaded]);

  const addDeal = useCallback((deal) => {
    const newDeal = { ...deal, id: 'deal_' + Date.now(), tasks: [], contingencies: [] };
    setDeals(prev => [newDeal, ...prev]);
    return newDeal;
  }, []);

  const updateDeal = useCallback((id, updates) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDeal = useCallback((id) => {
    setDeals(prev => prev.filter(d => d.id !== id));
  }, []);

  const toggleTask = useCallback((dealId, taskId) => {
    setDeals(prev => prev.map(d => {
      if (d.id !== dealId) return d;
      return {
        ...d,
        tasks: d.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      };
    }));
  }, []);

  const addTask = useCallback((dealId, text, urgent = false) => {
    const task = { id: 't' + Date.now(), text, done: false, urgent };
    setDeals(prev => prev.map(d => {
      if (d.id !== dealId) return d;
      return { ...d, tasks: [...(d.tasks || []), task] };
    }));
  }, []);

  const appendChatMessage = useCallback((mode, message) => {
    setChatHistory(prev => ({
      ...prev,
      [mode]: [...(prev[mode] || []), message]
    }));
  }, []);

  const clearChatHistory = useCallback((mode) => {
    setChatHistory(prev => ({ ...prev, [mode]: [] }));
  }, []);

  const getActiveDeal = useCallback(() => {
    return deals.find(d => d.id === activeDealId) || null;
  }, [deals, activeDealId]);

  const urgentTasks = deals.flatMap(d =>
    (d.tasks || []).filter(t => !t.done && t.urgent).map(t => ({ ...t, dealAddress: d.address, dealId: d.id }))
  );

  const activeListings = deals.filter(d => d.type === 'listing' && d.status === 'active');
  const activeTransactions = deals.filter(d => d.type === 'transaction' && d.status === 'under_contract');
  const buyerLeads = deals.filter(d => d.type === 'buyer');

  // Build context summary for AI
  const buildAIContext = useCallback(() => {
    const lines = [
      `Agent: ${agentProfile.name} at ${agentProfile.brokerage}`,
      '',
      'ACTIVE DEALS:',
      ...deals.map(d => {
        let line = `• [${d.type.toUpperCase()}] ${d.address} – ${d.client} – $${d.price?.toLocaleString()} – Status: ${d.status}`;
        if (d.closeDate) line += ` – Closing: ${d.closeDate}`;
        const pendingTasks = (d.tasks || []).filter(t => !t.done);
        if (pendingTasks.length) line += ` – Pending tasks: ${pendingTasks.map(t => t.text).join('; ')}`;
        return line;
      }),
    ];
    return lines.join('\n');
  }, [deals, agentProfile]);

  return (
    <AppContext.Provider value={{
      deals, contacts, agentProfile, setAgentProfile,
      activeView, setActiveView,
      activeDealId, setActiveDealId,
      aiMode, setAiMode,
      chatHistory, appendChatMessage, clearChatHistory,
      addDeal, updateDeal, deleteDeal, toggleTask, addTask,
      getActiveDeal, urgentTasks,
      activeListings, activeTransactions, buyerLeads,
      buildAIContext, isLoaded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
