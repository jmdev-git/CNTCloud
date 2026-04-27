import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "C:/uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent path traversal attacks
    const safe = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safe);

    if (!existsSync(filePath)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(safe).toLowerCase();

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
