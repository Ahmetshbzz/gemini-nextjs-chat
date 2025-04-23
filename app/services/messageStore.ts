"use client";
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  type: 'human' | 'gemini';
  text: string;
  timestamp: number;
  reactions: string[];
}

interface MessageStore {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'reactions' | 'timestamp'>) => void;
  addReaction: (messageId: string, emoji: string) => void;
  clearMessages: () => void;
  searchMessages: (query: string) => Message[];
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  
  addMessage: (messageData) => set((state) => {
    const newMessage: Message = {
      id: uuidv4(),
      text: messageData.text,
      type: messageData.type,
      timestamp: Date.now(),
      reactions: [],
    };
    
    return {
      messages: [...state.messages, newMessage],
    };
  }),
  
  addReaction: (messageId, emoji) => set((state) => {
    const updatedMessages = state.messages.map((message) => {
      if (message.id === messageId) {
        // Aynı emoji varsa ekleme, yoksa ekle
        if (!message.reactions.includes(emoji)) {
          return {
            ...message,
            reactions: [...message.reactions, emoji],
          };
        }
      }
      return message;
    });
    
    return {
      messages: updatedMessages,
    };
  }),
  
  clearMessages: () => set({ messages: [] }),
  
  searchMessages: (query) => {
    const { messages } = get();
    if (!query) return messages;
    
    const lowerCaseQuery = query.toLowerCase();
    return messages.filter((message) =>
      message.text.toLowerCase().includes(lowerCaseQuery)
    );
  },
})); 