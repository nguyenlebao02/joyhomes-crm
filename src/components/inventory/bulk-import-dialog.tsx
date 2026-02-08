"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjects, useImportProperties } from "@/hooks/use-inventory-queries";
import { parseImportData, getTemplateHeaders, getTemplateSampleRow, ImportResult } from "@/lib/inventory-import-parser";
import * as XLSX from "xlsx";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  const { data: projects } = useProjects() as {
    data: { id: string; name: string; code: string }[] | undefined;
  };
  const importMutation = useImportProperties();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const parsed = parseImportData(rows as Record<string, unknown>[], projectId);
      setResult(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = getTemplateHeaders();
    const sample = getTemplateSampleRow();
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "import-template-bang-hang.xlsx");
  };

  const handleImport = () => {
    if (!result?.valid.length) return;
    importMutation.mutate(result.valid as unknown as Record<string, unknown>[], {
      onSuccess: () => {
        setResult(null);
        setFileName("");
        onOpenChange(false);
      },
    });
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setResult(null);
      setFileName("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import bảng hàng</DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx) hoặc CSV để import hàng loạt. Tải template mẫu để đúng format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project select + Template download */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Dự án *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án để import" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Tải template
            </Button>
          </div>

          {/* File upload */}
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50"
            onClick={() => projectId && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileName ? (
              <>
                <FileSpreadsheet className="mb-2 h-8 w-8 text-green-600" />
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">Click để chọn file khác</p>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">
                  {projectId ? "Click để chọn file" : "Vui lòng chọn dự án trước"}
                </p>
                <p className="text-sm text-muted-foreground">Hỗ trợ .xlsx, .xls, .csv</p>
              </>
            )}
          </div>

          {/* Preview results */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.valid.length} hợp lệ
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {result.errors.length} lỗi
                </span>
                <span className="text-muted-foreground">
                  / {result.totalRows} dòng
                </span>
              </div>

              {/* Error list */}
              {result.errors.length > 0 && (
                <ScrollArea className="max-h-32 rounded border p-2">
                  <div className="space-y-1 text-sm">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-red-600">
                        Dòng {err.row}: [{err.field}] {err.message}
                      </p>
                    ))}
                    {result.errors.length > 20 && (
                      <p className="text-muted-foreground">...và {result.errors.length - 20} lỗi khác</p>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Valid preview */}
              {result.valid.length > 0 && (
                <ScrollArea className="max-h-48 rounded border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã căn</TableHead>
                        <TableHead>Tòa</TableHead>
                        <TableHead>Tầng</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Diện tích</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.valid.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>{row.building || "-"}</TableCell>
                          <TableCell>{row.floor ?? "-"}</TableCell>
                          <TableCell>{row.propertyType}</TableCell>
                          <TableCell>{row.area}m²</TableCell>
                          <TableCell>{Number(row.price).toLocaleString()}</TableCell>
                          <TableCell>{row.status}</TableCell>
                        </TableRow>
                      ))}
                      {result.valid.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            ...và {result.valid.length - 10} dòng khác
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              {/* Import button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={!result.valid.length || importMutation.isPending}
                >
                  {importMutation.isPending
                    ? "Đang import..."
                    : `Import ${result.valid.length}/${result.totalRows} dòng hợp lệ`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
