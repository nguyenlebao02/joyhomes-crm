"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSocket,
  initSocket,
  disconnectSocket,
  joinConversation,
  leaveConversation,
  startTyping as emitStartTyping,
  stopTyping as emitStopTyping,
  markAsRead as emitMarkAsRead,
} from "@/lib/socket";
import type { MessagePayload } from "@/lib/socket";
import { useChatStore } from "@/stores/chat-store";

interface UseSocketOptions {
  userId: string;
  userName: string;
  enabled?: boolean;
}

export function useSocket({ userId, userName, enabled = true }: UseSocketOptions) {
  const queryClient = useQueryClient();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setConnected,
    addOnlineUser,
    removeOnlineUser,
    addTypingUser,
    removeTypingUser,
    addMessage,
    updateMessageRead,
  } = useChatStore();

  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = initSocket(userId, userName);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Handle new messages
    socket.on("message:new", (message: MessagePayload) => {
      addMessage(message.conversationId, message);
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["messages", message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    // Handle read receipts
    socket.on("message:read", ({ conversationId, userId: readerId, readAt }) => {
      updateMessageRead(conversationId, readerId, readAt);
    });

    // Handle typing indicators
    socket.on("user:typing", ({ conversationId, userId: typerId, userName: typerName }) => {
      addTypingUser(conversationId, { id: typerId, name: typerName });
    });

    socket.on("user:stop-typing", ({ conversationId, userId: typerId }) => {
      removeTypingUser(conversationId, typerId);
    });

    // Handle online status
    socket.on("user:online", ({ userId: onlineUserId }) => {
      addOnlineUser(onlineUserId);
    });

    socket.on("user:offline", ({ userId: offlineUserId }) => {
      removeOnlineUser(offlineUserId);
    });

    return () => {
      disconnectSocket();
      setConnected(false);
    };
  }, [userId, userName, enabled, queryClient, setConnected, addOnlineUser, removeOnlineUser, addTypingUser, removeTypingUser, addMessage, updateMessageRead]);

  const joinRoom = useCallback((conversationId: string) => {
    joinConversation(conversationId);
  }, []);

  const leaveRoom = useCallback((conversationId: string) => {
    leaveConversation(conversationId);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    emitStartTyping(conversationId);
    // Auto stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(conversationId);
    }, 3000);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitStopTyping(conversationId);
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    emitMarkAsRead(conversationId);
  }, []);

  return {
    socket: getSocket(),
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
