"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquare, Plus, Search, Circle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  type: string;
  name?: string;
  participants: { id: string; name: string; image?: string }[];
  messages: { content: string; createdAt: string; senderId: string }[];
  property?: { id: string; code: string; project: { name: string } };
  updatedAt: string;
  _count?: { messages: number };
  unreadCount?: number;
}

async function fetchConversations() {
  const res = await fetch("/api/chat/conversations");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ChatPageContent({ currentUserId }: { currentUserId: string }) {
  const [search, setSearch] = useState("");
  const { isConnected, isUserOnline, unreadCounts } = useChatStore();

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 30000, // Reduced polling since we have real-time
  });

  const filteredConversations = conversations?.filter((c) => {
    if (!search) return true;
    const participantNames = c.participants.map((p) => p.name.toLowerCase()).join(" ");
    return participantNames.includes(search.toLowerCase()) ||
           c.name?.toLowerCase().includes(search.toLowerCase());
  });

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.property) return `${conv.property.code} - ${conv.property.project.name}`;
    const otherParticipants = conv.participants.filter((p) => p.id !== currentUserId);
    return otherParticipants.map((p) => p.name).join(", ") || "Cuộc trò chuyện";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.id !== currentUserId);
  };

  const getUnreadCount = (convId: string) => {
    return unreadCounts.get(convId) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tin nhắn</h1>
            <p className="text-muted-foreground">Chat với đồng nghiệp và nguồn hàng</p>
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5">
            <Circle
              className={cn(
                "h-2 w-2 fill-current",
                isConnected ? "text-green-500" : "text-gray-400"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <Link href="/messages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Cuộc trò chuyện mới
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm cuộc trò chuyện..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !filteredConversations?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
            <Link href="/messages/new">
              <Button className="mt-4">Bắt đầu trò chuyện</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => {
            const lastMessage = conv.messages[0];
            const convName = getConversationName(conv);
            const otherUser = getOtherParticipant(conv);
            const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
            const unread = getUnreadCount(conv.id);

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <Card className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  unread > 0 && "border-primary/50 bg-primary/5"
                )}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{getInitials(convName)}</AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      {conv.type === "DIRECT" && (
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className={cn("font-medium truncate", unread > 0 && "font-semibold")}>
                          {convName}
                        </p>
                        <div className="flex items-center gap-2">
                          {unread > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] px-1.5">
                              {unread > 99 ? "99+" : unread}
                            </Badge>
                          )}
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(lastMessage.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {lastMessage && (
                        <p className={cn(
                          "text-sm truncate",
                          unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {lastMessage.senderId === currentUserId && "Bạn: "}
                          {lastMessage.content}
                        </p>
                      )}
                      {conv.property && (
                        <p className="text-xs text-blue-600 mt-1">
                          🏠 {conv.property.code}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
