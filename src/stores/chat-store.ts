import { create } from "zustand";
import type { MessagePayload } from "@/lib/socket";

interface TypingUser {
  id: string;
  name: string;
}

interface ChatState {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Online users
  onlineUsers: Set<string>;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  isUserOnline: (userId: string) => boolean;

  // Typing indicators per conversation
  typingUsers: Map<string, TypingUser[]>;
  addTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  getTypingUsers: (conversationId: string) => TypingUser[];

  // Messages cache per conversation
  messages: Map<string, MessagePayload[]>;
  addMessage: (conversationId: string, message: MessagePayload) => void;
  setMessages: (conversationId: string, messages: MessagePayload[]) => void;
  getMessages: (conversationId: string) => MessagePayload[];

  // Read receipts
  readReceipts: Map<string, Map<string, string>>; // conversationId -> userId -> readAt
  updateMessageRead: (conversationId: string, userId: string, readAt: string) => void;

  // Unread counts
  unreadCounts: Map<string, number>;
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  clearUnreadCount: (conversationId: string) => void;

  // Active conversation
  activeConversationId: string | null;
  setActiveConversation: (conversationId: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Connection
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  // Online users
  onlineUsers: new Set(),
  addOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.add(userId);
      return { onlineUsers: newSet };
    }),
  removeOnlineUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.onlineUsers);
      newSet.delete(userId);
      return { onlineUsers: newSet };
    }),
  isUserOnline: (userId) => get().onlineUsers.has(userId),

  // Typing users
  typingUsers: new Map(),
  addTypingUser: (conversationId, user) =>
    set((state) => {
      const newMap = new Map(state.typingUsers);
      const users = newMap.get(conversationId) || [];
      if (!users.find((u) => u.id === user.id)) {
        newMap.set(conversationId, [...users, user]);
      }
      return { typingUsers: newMap };
    }),
  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const newMap = new Map(state.typingUsers);
      const users = newMap.get(conversationId) || [];
      newMap.set(conversationId, users.filter((u) => u.id !== userId));
      return { typingUsers: newMap };
    }),
  getTypingUsers: (conversationId) => get().typingUsers.get(conversationId) || [],

  // Messages
  messages: new Map(),
  addMessage: (conversationId, message) =>
    set((state) => {
      const newMap = new Map(state.messages);
      const msgs = newMap.get(conversationId) || [];
      // Check for duplicate
      if (!msgs.find((m) => m.id === message.id)) {
        newMap.set(conversationId, [...msgs, message]);
      }
      return { messages: newMap };
    }),
  setMessages: (conversationId, messages) =>
    set((state) => {
      const newMap = new Map(state.messages);
      newMap.set(conversationId, messages);
      return { messages: newMap };
    }),
  getMessages: (conversationId) => get().messages.get(conversationId) || [],

  // Read receipts
  readReceipts: new Map(),
  updateMessageRead: (conversationId, userId, readAt) =>
    set((state) => {
      const newMap = new Map(state.readReceipts);
      const convReceipts = newMap.get(conversationId) || new Map();
      convReceipts.set(userId, readAt);
      newMap.set(conversationId, convReceipts);
      return { readReceipts: newMap };
    }),

  // Unread counts
  unreadCounts: new Map(),
  setUnreadCount: (conversationId, count) =>
    set((state) => {
      const newMap = new Map(state.unreadCounts);
      newMap.set(conversationId, count);
      return { unreadCounts: newMap };
    }),
  incrementUnreadCount: (conversationId) =>
    set((state) => {
      const newMap = new Map(state.unreadCounts);
      const current = newMap.get(conversationId) || 0;
      newMap.set(conversationId, current + 1);
      return { unreadCounts: newMap };
    }),
  clearUnreadCount: (conversationId) =>
    set((state) => {
      const newMap = new Map(state.unreadCounts);
      newMap.set(conversationId, 0);
      return { unreadCounts: newMap };
    }),

  // Active conversation
  activeConversationId: null,
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
}));
