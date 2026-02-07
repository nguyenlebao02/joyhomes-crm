"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TypingUser {
  id: string;
  name: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].name} đang nhập...`;
    }
    if (users.length === 2) {
      return `${users[0].name} và ${users[1].name} đang nhập...`;
    }
    return `${users[0].name} và ${users.length - 1} người khác đang nhập...`;
  };

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(users[0].name)}
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg px-4 py-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{getTypingText()}</span>
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}
