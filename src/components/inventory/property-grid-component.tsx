"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Property {
  id: string;
  code: string;
  building?: string;
  floor?: number;
  unit?: string;
  propertyType: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  price: number;
  status: string;
}

interface PropertyGridProps {
  projectId: string;
  properties: Property[];
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-500",
  HOLD: "bg-yellow-500",
  BOOKED: "bg-blue-500",
  SOLD: "bg-red-500",
  UNAVAILABLE: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Còn",
  HOLD: "Giữ",
  BOOKED: "Đặt cọc",
  SOLD: "Đã bán",
  UNAVAILABLE: "Không bán",
};

const typeLabels: Record<string, string> = {
  APARTMENT: "Căn hộ",
  VILLA: "Biệt thự",
  TOWNHOUSE: "Nhà phố",
  SHOPHOUSE: "Shophouse",
  LAND: "Đất nền",
  OFFICE: "Văn phòng",
};

function formatPrice(price: number): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(1)} tỷ`;
  }
  return `${(price / 1000000).toFixed(0)} triệu`;
}

export function PropertyGridComponent({ projectId, properties }: PropertyGridProps) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch("/api/inventory/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_status_update", ids, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setSelectedIds([]);
    },
    onError: () => {
      toast.error("Có lỗi xảy ra");
    },
  });

  const filteredProperties = statusFilter === "all"
    ? properties
    : properties.filter((p) => p.status === statusFilter);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProperties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProperties.map((p) => p.id));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 căn");
      return;
    }
    updateStatusMutation.mutate({ ids: selectedIds, status });
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Lọc:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="AVAILABLE">Còn</SelectItem>
              <SelectItem value="HOLD">Giữ</SelectItem>
              <SelectItem value="BOOKED">Đặt cọc</SelectItem>
              <SelectItem value="SOLD">Đã bán</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Đã chọn: {selectedIds.length}</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("HOLD")}>
              Giữ
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("AVAILABLE")}>
              Mở bán
            </Button>
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${statusColors[status]}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Properties Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.length === filteredProperties.length && filteredProperties.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Mã căn</TableHead>
              <TableHead>Tòa</TableHead>
              <TableHead>Tầng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Diện tích</TableHead>
              <TableHead>PN</TableHead>
              <TableHead>Hướng</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Không có căn nào
                </TableCell>
              </TableRow>
            ) : (
              filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(property.id)}
                      onCheckedChange={() => toggleSelect(property.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{property.code}</TableCell>
                  <TableCell>{property.building || "-"}</TableCell>
                  <TableCell>{property.floor || "-"}</TableCell>
                  <TableCell>{typeLabels[property.propertyType]}</TableCell>
                  <TableCell>{property.area}m²</TableCell>
                  <TableCell>{property.bedrooms || "-"}</TableCell>
                  <TableCell>{property.direction || "-"}</TableCell>
                  <TableCell className="font-medium">{formatPrice(Number(property.price))}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${statusColors[property.status]}`} />
                      <span className="text-sm">{statusLabels[property.status]}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
