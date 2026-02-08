"use client";

import { useState } from "react";
import { Plus, Search, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProperties, PropertySearchFilters } from "@/hooks/use-inventory-queries";
import { formatPriceVnd } from "@/lib/format-price-vnd";
import { PropertyFormDialog } from "@/components/inventory/property-form-dialog";
import { BulkImportDialog } from "@/components/inventory/bulk-import-dialog";
import { InventoryFilterPanel } from "@/components/inventory/inventory-filter-panel";
import { Skeleton } from "@/components/ui/skeleton";

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

interface PropertyRow {
  id: string;
  code: string;
  building?: string;
  floor?: number;
  unit?: string;
  propertyType: string;
  area: number | string;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  price: number | string;
  status: string;
  project?: { id: string; name: string; code: string };
}

interface PropertiesResponse {
  properties: PropertyRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function InventoryPropertiesTab() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PropertySearchFilters>({ page: 1, limit: 20 });
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const mergedFilters: PropertySearchFilters = {
    ...filters,
    search: search || undefined,
  };

  const { data, isLoading } = useProperties(mergedFilters) as {
    data: PropertiesResponse | undefined;
    isLoading: boolean;
  };

  const handleEdit = (property: PropertyRow) => {
    setEditingProperty(property);
    setPropertyFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProperty(null);
    setPropertyFormOpen(true);
  };

  const handleFilterChange = (newFilters: Partial<PropertySearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã căn, toà..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm BĐS
          </Button>
        </div>
      </div>

      {/* Filters */}
      <InventoryFilterPanel filters={filters} onFilterChange={handleFilterChange} />

      {/* Status legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded ${statusColors[status]}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã căn</TableHead>
                  <TableHead>Dự án</TableHead>
                  <TableHead>Tòa</TableHead>
                  <TableHead>Tầng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>PN</TableHead>
                  <TableHead>Hướng</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.properties?.length ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      Không có bất động sản nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data.properties.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(p)}>
                      <TableCell className="font-medium">{p.code}</TableCell>
                      <TableCell className="text-muted-foreground">{p.project?.name || "-"}</TableCell>
                      <TableCell>{p.building || "-"}</TableCell>
                      <TableCell>{p.floor ?? "-"}</TableCell>
                      <TableCell>{typeLabels[p.propertyType] || p.propertyType}</TableCell>
                      <TableCell>{Number(p.area)}m²</TableCell>
                      <TableCell>{p.bedrooms ?? "-"}</TableCell>
                      <TableCell>{p.direction || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{formatPriceVnd(p.price)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${statusColors[p.status]}`} />
                          <span className="text-sm">{statusLabels[p.status]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p); }}>
                          Sửa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hiển thị {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} / {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="icon"
                  disabled={data.page <= 1}
                  onClick={() => handlePageChange(data.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Trang {data.page}/{data.totalPages}</span>
                <Button
                  variant="outline" size="icon"
                  disabled={data.page >= data.totalPages}
                  onClick={() => handlePageChange(data.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <PropertyFormDialog
        open={propertyFormOpen}
        onOpenChange={setPropertyFormOpen}
        property={editingProperty}
      />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
