"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ==================== FETCH HELPERS ====================

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}

async function mutateJson<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ==================== PROJECT QUERIES ====================

export function useProjects(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["projects", search],
    queryFn: () => fetchJson(`/api/inventory/projects?${params.toString()}`),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchJson(`/api/inventory/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => mutateJson("/api/inventory/projects", "POST", data),
    onSuccess: () => {
      toast.success("Tạo dự án thành công");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi tạo dự án"),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => mutateJson(`/api/inventory/projects/${id}`, "PATCH", data),
    onSuccess: () => {
      toast.success("Cập nhật dự án thành công");
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: () => toast.error("Lỗi khi cập nhật dự án"),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateJson(`/api/inventory/projects/${id}`, "DELETE"),
    onSuccess: () => {
      toast.success("Xoá dự án thành công");
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi xoá dự án"),
  });
}

// ==================== PROPERTY QUERIES ====================

export interface PropertySearchFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
  propertyType?: string;
  direction?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  search?: string;
}

export function useProperties(filters: PropertySearchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== "" && val !== null) params.set(key, String(val));
  });

  return useQuery({
    queryKey: ["properties", filters],
    queryFn: () => fetchJson(`/api/inventory/properties?${params.toString()}`),
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => mutateJson("/api/inventory/properties", "POST", data),
    onSuccess: () => {
      toast.success("Thêm BĐS thành công");
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi thêm BĐS"),
  });
}

export function useUpdateProperty(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => mutateJson(`/api/inventory/properties/${id}`, "PATCH", data),
    onSuccess: () => {
      toast.success("Cập nhật BĐS thành công");
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi cập nhật BĐS"),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateJson(`/api/inventory/properties/${id}`, "DELETE"),
    onSuccess: () => {
      toast.success("Xoá BĐS thành công");
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi xoá BĐS"),
  });
}

export function useImportProperties() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>[]) => mutateJson("/api/inventory/properties/import", "POST", { properties: data }),
    onSuccess: () => {
      toast.success("Import thành công");
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => toast.error("Lỗi khi import"),
  });
}
