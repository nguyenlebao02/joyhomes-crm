import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { auth } from "@/lib/auth";

// Socket event types
export interface ServerToClientEvents {
  "message:new": (message: MessagePayload) => void;
  "message:read": (data: { conversationId: string; userId: string; readAt: string }) => void;
  "user:typing": (data: { conversationId: string; userId: string; userName: string }) => void;
  "user:stop-typing": (data: { conversationId: string; userId: string }) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string }) => void;
  "conversation:updated": (data: { conversationId: string }) => void;
}

export interface ClientToServerEvents {
  "message:send": (data: SendMessagePayload, callback: (response: MessagePayload) => void) => void;
  "message:read": (data: { conversationId: string }) => void;
  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;
  "room:join": (conversationId: string) => void;
  "room:leave": (conversationId: string) => void;
}

export interface MessagePayload {
  id: string;
  conversationId: string;
  content: string;
  type: string;
  attachments?: string[];
  propertyId?: string;
  sender: { id: string; name: string; image?: string };
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  type: string;
  attachments?: string[];
  propertyId?: string;
}

// Store online users
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/socket",
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", async (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // Validate session via cookie instead of trusting client-supplied userId
    let userId: string;
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const sessionToken = cookieHeader
        .split(";")
        .map((c) => c.trim().split("="))
        .find(([k]) => k === "better-auth.session_token")?.[1];
      if (!sessionToken) {
        socket.disconnect();
        return;
      }
      const headers = new Headers();
      headers.set("cookie", `better-auth.session_token=${sessionToken}`);
      const session = await auth.api.getSession({ headers });
      if (!session?.user?.id) {
        socket.disconnect();
        return;
      }
      userId = session.user.id;
    } catch {
      socket.disconnect();
      return;
    }

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast user came online
      socket.broadcast.emit("user:online", { userId });
    }
    onlineUsers.get(userId)!.add(socket.id);

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);

    // Handle room joining (conversation rooms)
    socket.on("room:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("room:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle typing indicators
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("user:typing", {
        conversationId,
        userId,
        userName: socket.handshake.auth.userName || "User",
      });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("user:stop-typing", {
        conversationId,
        userId,
      });
    });

    // Handle message read
    socket.on("message:read", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("message:read", {
        conversationId,
        userId,
        readAt: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast user went offline
          socket.broadcast.emit("user:offline", { userId });
        }
      }
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}

export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
