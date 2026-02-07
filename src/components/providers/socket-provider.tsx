"use client";

import { useEffect, ReactNode } from "react";
import { useSocket } from "@/hooks/use-socket";

interface SocketProviderProps {
  children: ReactNode;
  userId: string;
  userName: string;
}

export function SocketProvider({ children, userId, userName }: SocketProviderProps) {
  const { socket } = useSocket({ userId, userName, enabled: !!userId });

  useEffect(() => {
    if (socket?.connected) {
      console.log("Socket provider: connected");
    }
  }, [socket?.connected]);

  return <>{children}</>;
}
