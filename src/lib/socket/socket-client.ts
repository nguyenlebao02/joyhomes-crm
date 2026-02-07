import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "./socket-server";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket;
}

export function initSocket(userId: string, userName: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) {
    return socket;
  }

  socket = io({
    path: "/api/socket",
    auth: { userId, userName },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId: string): void {
  socket?.emit("room:join", conversationId);
}

export function leaveConversation(conversationId: string): void {
  socket?.emit("room:leave", conversationId);
}

export function startTyping(conversationId: string): void {
  socket?.emit("typing:start", { conversationId });
}

export function stopTyping(conversationId: string): void {
  socket?.emit("typing:stop", { conversationId });
}

export function markAsRead(conversationId: string): void {
  socket?.emit("message:read", { conversationId });
}
