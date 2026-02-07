"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function fetchUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function NewConversationPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: users } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: async (participantIds: string[]) => {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: participantIds.length === 1 ? "DIRECT" : "GROUP",
          participantIds,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/messages/${data.id}`);
    },
    onError: () => {
      toast.error("Có lỗi xảy ra");
    },
  });

  const filteredUsers = users?.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị",
    MANAGER: "Quản lý",
    SALES: "Sales",
    ACCOUNTANT: "Kế toán",
    MARKETING: "Marketing",
    SUPPORT: "Hỗ trợ",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cuộc trò chuyện mới</h1>
          <p className="text-muted-foreground">Chọn người để bắt đầu chat</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
          <span>Đã chọn: {selectedIds.length} người</span>
          <Button onClick={() => createMutation.mutate(selectedIds)} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Đang tạo..." : "Bắt đầu chat"}
          </Button>
        </div>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredUsers?.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => toggleSelect(user.id)}
            >
              <Checkbox checked={selectedIds.includes(user.id)} />
              <Avatar>
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <span className="text-xs bg-muted px-2 py-1 rounded">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
