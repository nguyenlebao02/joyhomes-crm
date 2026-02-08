"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProjects, PropertySearchFilters } from "@/hooks/use-inventory-queries";
import { formatPriceVnd } from "@/lib/format-price-vnd";

interface FilterPanelProps {
  filters: PropertySearchFilters;
  onFilterChange: (filters: Partial<PropertySearchFilters>) => void;
}

const PRICE_MAX = 50_000_000_000; // 50 tỷ
const PRICE_STEP = 500_000_000; // 500 triệu
const AREA_MAX = 500;

const directionOptions = [
  "Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Đông Bắc", "Tây Nam", "Tây Bắc",
];

const propertyTypeOptions = [
  { value: "APARTMENT", label: "Căn hộ" },
  { value: "VILLA", label: "Biệt thự" },
  { value: "TOWNHOUSE", label: "Nhà phố" },
  { value: "SHOPHOUSE", label: "Shophouse" },
  { value: "LAND", label: "Đất nền" },
  { value: "OFFICE", label: "Văn phòng" },
];

const statusOptions = [
  { value: "AVAILABLE", label: "Còn" },
  { value: "HOLD", label: "Giữ" },
  { value: "BOOKED", label: "Đặt cọc" },
  { value: "SOLD", label: "Đã bán" },
  { value: "UNAVAILABLE", label: "Không bán" },
];

export function InventoryFilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: projects } = useProjects() as {
    data: { id: string; name: string; code: string }[] | undefined;
  };

  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || 0,
    filters.maxPrice || PRICE_MAX,
  ]);
  const [areaRange, setAreaRange] = useState<[number, number]>([
    filters.minArea || 0,
    filters.maxArea || AREA_MAX,
  ]);

  const selectedDirections = filters.direction ? filters.direction.split(",") : [];

  const hasActiveFilters = !!(
    filters.projectId || filters.status || filters.propertyType ||
    filters.direction || filters.minPrice || filters.maxPrice ||
    filters.minArea || filters.maxArea
  );

  const handleDirectionToggle = (dir: string) => {
    const current = new Set(selectedDirections);
    if (current.has(dir)) {
      current.delete(dir);
    } else {
      current.add(dir);
    }
    const val = Array.from(current).join(",");
    onFilterChange({ direction: val || undefined });
  };

  const handleApplyPrice = () => {
    onFilterChange({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
    });
  };

  const handleApplyArea = () => {
    onFilterChange({
      minArea: areaRange[0] > 0 ? areaRange[0] : undefined,
      maxArea: areaRange[1] < AREA_MAX ? areaRange[1] : undefined,
    });
  };

  const handleClearFilters = () => {
    setPriceRange([0, PRICE_MAX]);
    setAreaRange([0, AREA_MAX]);
    onFilterChange({
      projectId: undefined,
      status: undefined,
      propertyType: undefined,
      direction: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setExpanded(!expanded)}
        >
          Bộ lọc nâng cao
          {hasActiveFilters && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">!</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-1 h-3 w-3" />
            Xoá bộ lọc
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Project filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Dự án</Label>
            <Select
              value={filters.projectId || "all"}
              onValueChange={(v) => onFilterChange({ projectId: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả dự án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả dự án</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Loại BĐS</Label>
            <Select
              value={filters.propertyType || "all"}
              onValueChange={(v) => onFilterChange({ propertyType: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {propertyTypeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Trạng thái</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(v) => onFilterChange({ status: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Khoảng giá</Label>
            <Slider
              min={0}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              onValueCommit={handleApplyPrice}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPriceVnd(priceRange[0])}</span>
              <span>{formatPriceVnd(priceRange[1])}</span>
            </div>
          </div>

          {/* Area range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Diện tích (m²)</Label>
            <Slider
              min={0}
              max={AREA_MAX}
              step={5}
              value={areaRange}
              onValueChange={(v) => setAreaRange(v as [number, number])}
              onValueCommit={handleApplyArea}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{areaRange[0]}m²</span>
              <span>{areaRange[1]}m²</span>
            </div>
          </div>

          {/* Direction checkboxes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hướng</Label>
            <div className="grid grid-cols-2 gap-2">
              {directionOptions.map((dir) => (
                <label key={dir} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedDirections.includes(dir)}
                    onCheckedChange={() => handleDirectionToggle(dir)}
                  />
                  {dir}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
