
import { useState, useEffect, useCallback } from 'react';
import type { JournalEntry, ChatMessage } from '../types';

const JOURNAL_STORAGE_KEY = 'wildlens_journal';

export const useJournal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("Failed to load journal entries from localStorage", error);
    }
  }, []);

  const saveEntries = useCallback((updatedEntries: JournalEntry[]) => {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Failed to save journal entries to localStorage", error);
    }
  }, []);

  const addEntry = useCallback((newEntry: Omit<JournalEntry, 'id'>) => {
    const entryWithId: JournalEntry = { 
      ...newEntry, 
      id: `wildlens-${Date.now()}`,
      chatHistory: [], // Initialize chat history
    };
    const updatedEntries = [entryWithId, ...entries];
    saveEntries(updatedEntries);
  }, [entries, saveEntries]);

  const removeEntry = useCallback((id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    saveEntries(updatedEntries);
  }, [entries, saveEntries]);

  const updateEntryChatHistory = useCallback((id: string, newHistory: ChatMessage[]) => {
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, chatHistory: newHistory };
      }
      return entry;
    });
    saveEntries(updatedEntries);
  }, [entries, saveEntries]);

  const clearJournal = useCallback(() => {
    try {
      localStorage.removeItem(JOURNAL_STORAGE_KEY);
      setEntries([]);
    } catch (error) {
      console.error("Failed to clear journal entries from localStorage", error);
    }
  }, []);

  return { entries, addEntry, removeEntry, updateEntryChatHistory, clearJournal };
};