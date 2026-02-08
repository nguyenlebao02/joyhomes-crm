"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Send, Home, Paperclip, Image as ImageIcon, Share2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { PropertyShareDialog } from "@/components/chat/property-share-dialog";
import { FileUploadButton } from "@/components/chat/file-upload-button";
import { useSocket } from "@/hooks/use-socket";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  type: string;
  attachments?: string[];
  createdAt: string;
  isRead?: boolean;
  readAt?: string;
  sender: { id: string; name: string; image?: string };
}

interface Conversation {
  id: string;
  type: string;
  name?: string;
  participants: { id: string; name: string; image?: string; role?: string }[];
  property?: {
    id: string;
    code: string;
    area: number;
    price: number;
    project: { name: string };
  };
}

async function fetchConversation(id: string) {
  const res = await fetch(`/api/chat/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchMessages(id: string) {
  const res = await fetch(`/api/chat/conversations/${id}?messages=true`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ChatThreadContent({ currentUserId }: { currentUserId: string }) {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getTypingUsers, isUserOnline, clearUnreadCount, setActiveConversation } = useChatStore();
  const { joinRoom, leaveRoom, startTyping, stopTyping, markAsRead } = useSocket({
    userId: currentUserId,
    userName: "",
    enabled: true,
  });

  // Join room on mount
  useEffect(() => {
    if (id) {
      joinRoom(id);
      setActiveConversation(id);
      clearUnreadCount(id);
      markAsRead(id);
    }
    return () => {
      if (id) {
        leaveRoom(id);
        setActiveConversation(null);
      }
    };
  }, [id, joinRoom, leaveRoom, setActiveConversation, clearUnreadCount, markAsRead]);

  const { data: conversation, isLoading: convLoading } = useQuery<Conversation>({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id),
  });

  const { data: messages, isLoading: msgLoading } = useQuery<Message[]>({
    queryKey: ["messages", id],
    queryFn: () => fetchMessages(id),
    refetchInterval: 10000, // Reduced polling with real-time
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { content: string; type: string; attachments?: string[]; propertyId?: string }) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id, ...data }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
      stopTyping(id);
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;
    sendMutation.mutate({ content: newMessage, type: "TEXT" });
  }, [newMessage, sendMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value) {
      startTyping(id);
    } else {
      stopTyping(id);
    }
  }, [id, startTyping, stopTyping]);

  const handleFileUpload = useCallback((urls: string[]) => {
    sendMutation.mutate({
      content: "Đã gửi tệp đính kèm",
      type: "FILE",
      attachments: urls,
    });
  }, [sendMutation]);

  const handleImageUpload = useCallback((urls: string[]) => {
    sendMutation.mutate({
      content: "Đã gửi hình ảnh",
      type: "IMAGE",
      attachments: urls,
    });
  }, [sendMutation]);

  const handlePropertyShare = useCallback((propertyId: string, propertyInfo: string) => {
    sendMutation.mutate({
      content: propertyInfo,
      type: "PROPERTY_SHARE",
      propertyId,
    });
    setShowPropertyDialog(false);
  }, [sendMutation]);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getConversationName = () => {
    if (!conversation) return "";
    if (conversation.name) return conversation.name;
    if (conversation.property) return `${conversation.property.code} - ${conversation.property.project.name}`;
    const others = conversation.participants.filter((p) => p.id !== currentUserId);
    return others.map((p) => p.name).join(", ");
  };

  const getOtherParticipant = () => {
    if (!conversation) return null;
    return conversation.participants.find((p) => p.id !== currentUserId);
  };

  const typingUsers = getTypingUsers(id);
  const otherUser = getOtherParticipant();
  const isOnline = otherUser ? isUserOnline(otherUser.id) : false;

  if (convLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy cuộc trò chuyện</p>
        <Link href="/messages">
          <Button variant="link">Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getInitials(getConversationName())}</AvatarFallback>
          </Avatar>
          {conversation.type === "DIRECT" && (
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                isOnline ? "bg-green-500" : "bg-gray-400"
              )}
            />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{getConversationName()}</p>
          <p className="text-sm text-muted-foreground">
            {isOnline ? (
              <span className="text-green-600">Đang hoạt động</span>
            ) : (
              `${conversation.participants.length} thành viên`
            )}
          </p>
        </div>
      </div>

      {/* Property Info (if property chat) */}
      {conversation.property && (
        <Card className="mt-4 bg-blue-50">
          <CardContent className="flex items-center gap-3 p-3">
            <Home className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium">{conversation.property.code}</p>
              <p className="text-sm text-muted-foreground">
                {conversation.property.project.name} • {conversation.property.area}m² •
                {(Number(conversation.property.price) / 1000000000).toFixed(1)} tỷ
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {msgLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-2/3" />
            ))}
          </div>
        ) : !messages?.length ? (
          <p className="text-center text-muted-foreground py-8">
            Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender.id === currentUserId;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender.id !== msg.sender.id);
            const isLastFromMe = isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender.id !== currentUserId);

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && (
                    <Avatar className={cn("h-8 w-8", !showAvatar && "invisible")}>
                      <AvatarFallback className="text-xs">
                        {getInitials(msg.sender.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    {!isMe && showAvatar && (
                      <p className="text-xs text-muted-foreground mb-1">{msg.sender.name}</p>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2",
                        isMe ? "bg-primary text-primary-foreground" : "bg-muted",
                        msg.type === "PROPERTY_SHARE" && "bg-blue-100 border border-blue-200"
                      )}
                    >
                      {msg.type === "PROPERTY_SHARE" ? (
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-blue-600" />
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      ) : msg.type === "IMAGE" && msg.attachments?.length ? (
                        <div className="space-y-2">
                          {msg.attachments.map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={url}
                              alt="Attached image"
                              className="max-w-full rounded-md"
                            />
                          ))}
                        </div>
                      ) : msg.type === "FILE" && msg.attachments?.length ? (
                        <div className="space-y-1">
                          {msg.attachments.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm underline"
                            >
                              <Paperclip className="h-4 w-4" />
                              Tệp đính kèm {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(msg.createdAt), "HH:mm", { locale: vi })}
                      </p>
                      {/* Read receipt for sent messages */}
                      {isMe && isLastFromMe && (
                        <span className="text-xs text-muted-foreground">
                          {msg.isRead ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2">
          <FileUploadButton
            accept="image/*"
            icon={<ImageIcon className="h-4 w-4" />}
            onUpload={handleImageUpload}
          />
          <FileUploadButton
            accept="*/*"
            icon={<Paperclip className="h-4 w-4" />}
            onUpload={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPropertyDialog(true)}
            title="Chia sẻ bất động sản"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sendMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Property Share Dialog */}
      <PropertyShareDialog
        open={showPropertyDialog}
        onOpenChange={setShowPropertyDialog}
        onSelect={handlePropertyShare}
      />
    </div>
  );
}
