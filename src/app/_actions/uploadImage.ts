'use server';

import { getClient } from "@/lib/nas";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

export async function uploadImage(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const isImage = (file.type && file.type.startsWith("image/")) || 
                   /\.(jpg|jpeg|jfif|webp|png|gif)$/i.test(file.name);

    if (isImage) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary credentials missing");
        return { success: false, error: "Cloudinary configuration missing on server" };
      }

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });

      const folder = process.env.CLOUDINARY_FOLDER || "digital_bulletin";
      const base64 = buffer.toString("base64");
      const dataUri = `data:${file.type || 'image/jpeg'};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      revalidatePath("/");
      return { success: true, url: result.secure_url, publicId: result.public_id };
    }

    if (!process.env.NAS_URL || !process.env.NAS_USER || !process.env.NAS_PASS) {
      console.error("NAS credentials missing");
      return { success: false, error: "NAS configuration missing on server" };
    }

    const client = getClient();
    const remotePath = `/uploads/${file.name}`;
    
    // Ensure the buffer is not empty
    if (buffer.length === 0) {
      return { success: false, error: "File buffer is empty" };
    }

    await client.putFileContents(remotePath, buffer);
    revalidatePath("/");
    return { success: true, path: remotePath };
  } catch (error: any) {
    console.error("Upload Error Details:", error);
    const message = error?.message || "Internal server error during upload";
    return { success: false, error: message };
  }
}
