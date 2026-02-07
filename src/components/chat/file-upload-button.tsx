"use client";

import { useRef, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadButtonProps {
  accept: string;
  icon: ReactNode;
  onUpload: (urls: string[]) => void;
  multiple?: boolean;
}

export function FileUploadButton({ accept, icon, onUpload, multiple = false }: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Upload failed");
        }

        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      onUpload(urls);
      toast.success("Tải lên thành công");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể tải lên tệp");
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
      </Button>
    </>
  );
}
