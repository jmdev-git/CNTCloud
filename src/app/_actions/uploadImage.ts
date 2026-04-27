'use server';

import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "C:/uploads";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return { success: false, error: "File buffer is empty" };
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await writeFile(filePath, buffer);

    revalidatePath("/");
    // Return a URL that goes through our local serve API
    return { success: true, url: `/api/uploads/${filename}` };
  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, error: error?.message || "Upload failed" };
  }
}
