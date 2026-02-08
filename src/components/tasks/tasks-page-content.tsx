"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: { id: string; name: string };
  creator: { id: string; name: string };
  customer?: { id: string; name: string };
}

async function fetchTasks(status?: string) {
  const params = new URLSearchParams({ my: "true" });
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/tasks?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const priorityColors: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-500",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

const priorityLabels: Record<string, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

export function TasksPageContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["my-tasks", statusFilter],
    queryFn: () => fetchTasks(statusFilter),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });

  const toggleDone = (task: Task) => {
    const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    updateMutation.mutate({ id: task.id, status: newStatus });
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() ;
  };

  const todoTasks = tasks?.filter((t) => t.status === "TODO") || [];
  const inProgressTasks = tasks?.filter((t) => t.status === "IN_PROGRESS") || [];
  const doneTasks = tasks?.filter((t) => t.status === "COMPLETED") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Công việc</h1>
          <p className="text-muted-foreground">Quản lý tasks được giao cho bạn</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo task
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="TODO">Cần làm</SelectItem>
            <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !tasks?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có task nào</p>
            <Link href="/tasks/new">
              <Button className="mt-4">Tạo task đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* To Do */}
          {todoTasks.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Cần làm ({todoTasks.length})
              </h3>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={toggleDone} isOverdue={isOverdue} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {inProgressTasks.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2 text-blue-600">
                <AlertCircle className="h-4 w-4" /> Đang làm ({inProgressTasks.length})
              </h3>
              <div className="space-y-2">
                {inProgressTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={toggleDone} isOverdue={isOverdue} />
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {doneTasks.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2 text-green-600">
                <CheckSquare className="h-4 w-4" /> Hoàn thành ({doneTasks.length})
              </h3>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={toggleDone} isOverdue={isOverdue} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  isOverdue,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  isOverdue: (date?: string) => boolean;
}) {
  return (
    <Card className={task.status === "COMPLETED" ? "opacity-60" : ""}>
      <CardContent className="flex items-center gap-4 p-4">
        <Checkbox
          checked={task.status === "COMPLETED"}
          onCheckedChange={() => onToggle(task)}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
              {task.title}
            </Link>
            <span className={`text-xs ${priorityColors[task.priority]}`}>
              [{priorityLabels[task.priority]}]
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {task.assignee && <span>👤 {task.assignee.name}</span>}
            {task.customer && <span>🏠 {task.customer.name}</span>}
            {task.dueDate && (
              <span className={isOverdue(task.dueDate) && task.status !== "COMPLETED" ? "text-red-500" : ""}>
                📅 {format(new Date(task.dueDate), "dd/MM/yyyy", { locale: vi })}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
