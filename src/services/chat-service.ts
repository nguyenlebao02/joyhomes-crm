import { db } from "@/lib/db";
import type { ConversationCreateInput, MessageCreateInput } from "@/lib/validators/chat-validation-schema";

// Get user's conversations
export async function getConversations(userId: string) {
  return db.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, fullName: true, avatar: true } } },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get conversation by ID with messages
export async function getConversationById(id: string, userId: string) {
  const conversation = await db.conversation.findFirst({
    where: {
      id,
      participants: { some: { userId } },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, fullName: true, avatar: true, role: true } } },
      },
    },
  });

  return conversation;
}

// Get messages for a conversation
export async function getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
  // Verify user is participant
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId } },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const messages = await db.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, fullName: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  // Mark messages as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return messages.reverse();
}

// Create new conversation
export async function createConversation(data: ConversationCreateInput, creatorId: string) {
  // Add creator to participants if not already included
  const allParticipantIds = [...new Set([...data.participantIds, creatorId])];

  // Check for existing direct conversation
  if (data.type === "DIRECT" && allParticipantIds.length === 2) {
    const existing = await db.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: allParticipantIds.map((userId) => ({
          participants: { some: { userId } },
        })),
      },
      include: {
        participants: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
      },
    });

    if (existing) return existing;
  }

  return db.conversation.create({
    data: {
      type: data.type,
      name: data.name,
      participants: {
        create: allParticipantIds.map((userId) => ({ userId })),
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
    },
  });
}

// Send message
export async function sendMessage(data: MessageCreateInput, senderId: string) {
  // Verify sender is participant
  const conversation = await db.conversation.findFirst({
    where: {
      id: data.conversationId,
      participants: { some: { userId: senderId } },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const [message] = await db.$transaction([
    db.message.create({
      data: {
        conversationId: data.conversationId,
        senderId,
        content: data.content,
        type: data.type,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatar: true } },
      },
    }),
    db.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return message;
}

// Get unread count
export async function getUnreadCount(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    select: { id: true },
  });

  const count = await db.message.count({
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: userId },
      isRead: false,
    },
  });

  return count;
}

// Get online users (for presence feature)
export async function getOnlineUsers() {
  // Simple implementation: users who have been active in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  return db.user.findMany({
    where: {
      updatedAt: { gte: fiveMinutesAgo },
    },
    select: { id: true, fullName: true, avatar: true },
  });
}
