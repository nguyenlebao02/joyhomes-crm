import { z } from "zod";

// Conversation type enum (matches Prisma schema)
export const ConversationType = z.enum([
  "DIRECT",       // Chat 1-1
  "GROUP",        // Nhóm chat
]);

// Message type enum
export const MessageType = z.enum([
  "TEXT",
  "IMAGE",
  "FILE",
  "PROPERTY_SHARE",  // Chia sẻ thông tin sản phẩm
]);

// Create conversation schema
export const conversationCreateSchema = z.object({
  type: ConversationType.default("DIRECT"),
  name: z.string().optional(),
  participantIds: z.array(z.string()).min(1, "Cần ít nhất 1 người tham gia"),
  propertyId: z.string().optional(),
});

// Send message schema
export const messageCreateSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, "Nội dung không được trống"),
  type: MessageType.default("TEXT"),
  propertyId: z.string().optional(), // For PROPERTY_SHARE type
});

// Types
export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
