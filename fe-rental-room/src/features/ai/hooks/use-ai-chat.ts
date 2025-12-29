import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/ai-api';
import type { AIChatRoom } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  rooms?: AIChatRoom[];
}

const STORAGE_KEY = 'ai-chat-history';
const MAX_HISTORY = 50;

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as Array<ChatMessage & { timestamp: string }>;
      return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Initial load handled in state initializer

  // Save to localStorage whenever messages change
  const saveToStorage = useCallback((msgs: ChatMessage[]) => {
    try {
      const toSave = msgs.slice(-MAX_HISTORY).map((m) => ({
        ...m,
        isTyping: false, // Don't persist typing state
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, []);

  const chatMutation = useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: string }) => {
      const response = await aiApi.chat(message, context);
      return response;
    },
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      saveToStorage(updated);
      return updated;
    });

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: `assistant-typing-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, typingMessage]);

    try {
      // Build context from last 3 messages
      const context = messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await chatMutation.mutateAsync({
        message: content,
        context: context || undefined,
      });

      // Remove typing indicator and add real response
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date(response.timestamp),
          rooms: response.rooms,
        };
        const updated = [...withoutTyping, assistantMessage];
        saveToStorage(updated);
        return updated;
      });
    } catch {
      // Remove typing indicator and show error
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => !m.isTyping);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn. Vui lòng thử lại.',
          timestamp: new Date(),
        };
        const updated = [...withoutTyping, errorMessage];
        saveToStorage(updated);
        return updated;
      });
    }
  }, [messages, chatMutation, saveToStorage]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    messages,
    isOpen,
    isLoading: chatMutation.isPending,
    sendMessage,
    clearHistory,
    toggleOpen,
    setIsOpen,
  };
}

// Quick suggestions for first-time users
export const CHAT_SUGGESTIONS = [
  'Phòng gần ĐH giá bao nhiêu?',
  'Phòng có máy lạnh dưới 3 triệu',
  'Cách đặt phòng như thế nào?',
  'Phòng có ban công thoáng mát',
];
