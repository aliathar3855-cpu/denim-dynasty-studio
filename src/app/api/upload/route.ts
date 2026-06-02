import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const filesList = formData.getAll("files") as File[];

    const files: File[] = [...filesList];

    // Fallback support for single file upload key
    if (files.length === 0) {
      const singleFile = formData.get("file") as File;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image files provided for upload." },
        { status: 400 }
      );
    }

    const secureUrls: string[] = [];

    for (const file of files) {
      // Convert file to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary using upload_stream helper
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "denim-dynasty",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      if (uploadResult && uploadResult.secure_url) {
        secureUrls.push(uploadResult.secure_url);
      } else {
        throw new Error("Failed to retrieve secure URL from Cloudinary stream upload.");
      }
    }

    return NextResponse.json({ success: true, urls: secureUrls });
  } catch (error: any) {
    console.error("Cloudinary upload API Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process image upload." },
      { status: 500 }
    );
  }
}
