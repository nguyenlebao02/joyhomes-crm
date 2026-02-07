"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Building2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

async function fetchProjects(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const res = await fetch(`/api/inventory/projects?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

const statusColors: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800",
  OPEN: "bg-green-100 text-green-800",
  SOLD_OUT: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  UPCOMING: "Sắp mở bán",
  OPEN: "Đang mở bán",
  SOLD_OUT: "Hết hàng",
  COMPLETED: "Hoàn thành",
};

export function InventoryProjectsContent() {
  const [search, setSearch] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", search],
    queryFn: () => fetchProjects(search),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng hàng</h1>
          <p className="text-muted-foreground">Quản lý dự án và sản phẩm bất động sản</p>
        </div>
        <Link href="/inventory/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm dự án..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chưa có dự án nào</p>
            <Link href="/inventory/projects/new">
              <Button className="mt-4">Thêm dự án đầu tiên</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project: {
            id: string;
            code: string;
            name: string;
            location: string;
            status: string;
            totalUnits: number;
            availableUnits: number;
            _count?: { properties: number; bookings: number };
          }) => (
            <Link key={project.id} href={`/inventory/projects/${project.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{project.code}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.location}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tổng căn</p>
                      <p className="text-lg font-semibold">{project.totalUnits}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Còn lại</p>
                      <p className="text-lg font-semibold text-green-600">{project.availableUnits}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
