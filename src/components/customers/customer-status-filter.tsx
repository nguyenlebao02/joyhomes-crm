"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUALIFIED", label: "Đủ điều kiện" },
  { value: "NEGOTIATING", label: "Đang đàm phán" },
  { value: "WON", label: "Thành công" },
  { value: "LOST", label: "Thất bại" },
  { value: "DORMANT", label: "Ngưng hoạt động" },
];

const sourceOptions = [
  { value: "", label: "Tất cả nguồn" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "ZALO", label: "Zalo" },
  { value: "REFERRAL", label: "Giới thiệu" },
  { value: "WALK_IN", label: "Tự đến" },
  { value: "EVENT", label: "Sự kiện" },
  { value: "HOTLINE", label: "Hotline" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Khác" },
];

export function CustomerStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/customers?${params.toString()}`);
  };

  const handleSourceChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("source", value);
    } else {
      params.delete("source");
    }
    params.set("page", "1");
    router.push(`/customers?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <Select
        value={searchParams.get("status") || ""}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("source") || ""}
        onValueChange={handleSourceChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Nguồn" />
        </SelectTrigger>
        <SelectContent>
          {sourceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
