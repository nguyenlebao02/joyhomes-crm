import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Allowed file types with their magic bytes signatures
const FILE_SIGNATURES: Record<string, { magic: number[][]; ext: string }> = {
  "image/jpeg": { magic: [[0xff, 0xd8, 0xff]], ext: "jpg" },
  "image/png": { magic: [[0x89, 0x50, 0x4e, 0x47]], ext: "png" },
  "image/gif": { magic: [[0x47, 0x49, 0x46, 0x38]], ext: "gif" },
  "image/webp": { magic: [[0x52, 0x49, 0x46, 0x46]], ext: "webp" }, // RIFF header
  "application/pdf": { magic: [[0x25, 0x50, 0x44, 0x46]], ext: "pdf" },
  // Office formats (ZIP-based: docx, xlsx)
  "application/zip": { magic: [[0x50, 0x4b, 0x03, 0x04]], ext: "zip" },
  // Plain text - no magic bytes, validated by extension only
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"]);
const TEXT_EXTENSIONS = new Set(["txt", "doc"]);
const ZIP_BASED_EXTENSIONS = new Set(["docx", "xlsx"]);

/** Validate file content matches expected type via magic bytes */
function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  // Text/legacy Office files don't have reliable magic bytes
  if (TEXT_EXTENSIONS.has(ext)) return true;

  // ZIP-based Office formats (docx, xlsx) use ZIP magic bytes
  if (ZIP_BASED_EXTENSIONS.has(ext)) {
    const zipMagic = [0x50, 0x4b, 0x03, 0x04];
    return zipMagic.every((byte, i) => buffer[i] === byte);
  }

  // Check magic bytes for known types
  for (const sig of Object.values(FILE_SIGNATURES)) {
    if (sig.ext === ext || (ext === "jpeg" && sig.ext === "jpg")) {
      return sig.magic.some((magic) =>
        magic.every((byte, i) => buffer[i] === byte)
      );
    }
  }

  return false;
}

// POST /api/upload - Upload file
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Extract and validate extension (use last segment after splitting all dots)
    const nameParts = file.name.split(".");
    const ext = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : "";

    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes match the claimed extension
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json({ error: "File content does not match extension" }, { status: 400 });
    }

    // Generate safe unique filename (UUID prevents path traversal)
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename: file.name }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
