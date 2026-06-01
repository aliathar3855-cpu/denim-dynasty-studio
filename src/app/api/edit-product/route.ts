import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { db } from "@/firebase/config";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;
    const description = (formData.get("description") as string) || "";
    const sizeType = (formData.get("sizeType") as string) || "";
    const sizesStr = (formData.get("sizes") as string) || "[]";
    const sizes = JSON.parse(sizesStr);

    if (!id || !name || !price || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;

    // Only upload if a file was actually selected and sent
    if (file && file.name && file.size > 0) {
      // Convert file to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary using upload_stream
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

      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload new image to Cloudinary");
      }

      imageUrl = uploadResult.secure_url;
    }

    // Build update object
    const updateData: any = {
      name,
      price: Number(price),
      category,
      description,
      sizeType,
      sizes,
      updatedAt: new Date(),
    };

    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // Update Firestore document
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Edit Product API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}
