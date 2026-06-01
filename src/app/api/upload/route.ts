import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { db } from "@/firebase/config";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;
    const description = (formData.get("description") as string) || "";
    const sizeType = (formData.get("sizeType") as string) || "";
    const sizesStr = (formData.get("sizes") as string) || "[]";
    const sizes = JSON.parse(sizesStr);

    if (!file || !name || !price || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

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
      throw new Error("Failed to get secure URL from Cloudinary upload");
    }

    const imageUrl = uploadResult.secure_url;

    // Save product to Firestore
    const docRef = await addDoc(collection(db, "products"), {
      name,
      price: Number(price),
      category,
      description,
      imageUrl,
      sizeType,
      sizes,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Upload Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image and save product" },
      { status: 500 }
    );
  }
}
