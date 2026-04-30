'use server';

import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { fileTypeFromBuffer } from "file-type";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "C:/uploads";

// Allowed MIME types and their expected extensions
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/gif":  ".gif",
  "image/webp": ".webp",
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return { success: false, error: "File is empty" };
    }

    // Size check
    if (buffer.length > MAX_SIZE_BYTES) {
      return { success: false, error: "File exceeds 5MB limit" };
    }

    // ── Magic Byte Check ──────────────────────────────────────────────
    // Read actual file signature — ignores what the browser claims
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected || !ALLOWED_TYPES[detected.mime]) {
      // Log the suspicious upload attempt
      try {
        const { recordSecurityEvent } = await import('@/utils/logger');
        await recordSecurityEvent('security_invalid_file_upload', {
          reason: `Blocked upload — detected MIME: ${detected?.mime ?? 'unknown'}, claimed name: ${file.name}`,
          endpoint: '/api/upload (server action)',
        });
      } catch {}
      return {
        success: false,
        error: `File type not allowed. Detected: ${detected?.mime ?? "unknown"}. Only JPG, PNG, GIF, WEBP are accepted.`,
      };
    }

    // Double-check: extension from magic bytes must match allowed list
    const ext = ALLOWED_TYPES[detected.mime]; // e.g. ".jpg"

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await writeFile(filePath, buffer);

    revalidatePath("/");
    return { success: true, url: `/api/uploads/${filename}` };

  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, error: error?.message || "Upload failed" };
  }
}
