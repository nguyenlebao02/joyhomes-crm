"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Home, Building } from "lucide-react";

interface Property {
  id: string;
  code: string;
  area: number;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  project: { name: string };
}

interface PropertyShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (propertyId: string, propertyInfo: string) => void;
}

async function fetchProperties(search: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("status", "AVAILABLE");
  params.set("limit", "10");

  const res = await fetch(`/api/properties?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.properties || data;
}

export function PropertyShareDialog({ open, onOpenChange, onSelect }: PropertyShareDialogProps) {
  const [search, setSearch] = useState("");

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["properties-share", search],
    queryFn: () => fetchProperties(search),
    enabled: open,
  });

  const formatPrice = (price: number) => {
    const billions = price / 1000000000;
    if (billions >= 1) {
      return `${billions.toFixed(1)} tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} triệu`;
  };

  const handleSelect = (property: Property) => {
    const info = `🏠 ${property.code} - ${property.project.name}\n📐 ${property.area}m² | ${property.bedrooms || 0} PN | ${property.bathrooms || 0} WC\n💰 ${formatPrice(Number(property.price))}`;
    onSelect(property.id, info);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Chia sẻ bất động sản
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã hoặc tên dự án..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Properties list */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </>
            ) : !properties?.length ? (
              <p className="text-center text-muted-foreground py-8">
                Không tìm thấy bất động sản
              </p>
            ) : (
              properties.map((property) => (
                <Card
                  key={property.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelect(property)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                      <Home className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{property.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.project.name} • {property.area}m² • {property.bedrooms || 0} PN
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {formatPrice(Number(property.price))}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
