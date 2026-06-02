"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { addProduct, formatSize } from "@/lib/products";
import { uploadImages } from "@/lib/upload";
import { toast } from "react-hot-toast";

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const NUMERIC_SIZES = ["16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"];

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // Acts as Sale Price/Regular Price
  const [originalPrice, setOriginalPrice] = useState(""); // MRP (Optional)
  const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("IN_STOCK");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [sizeType, setSizeType] = useState<"LETTER" | "NUMERIC">("LETTER");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Clean up preview object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      uploadPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [uploadPreviews]);

  const handleSizeChange = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSizeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSizeType(e.target.value as "LETTER" | "NUMERIC");
    setSelectedSizes([]); // Reset selected sizes when size type changes
  };

  // Image selection handler (stages files locally and generates preview URLs)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    console.log("Selected file(s):", fileList); // Console log: Selected files

    // Stage files in state
    setSelectedFiles((prev) => [...prev, ...fileList]);

    // Generate object URLs for immediate preview
    const localPreviews = fileList.map((file) => URL.createObjectURL(file));
    setUploadPreviews((prev) => [...prev, ...localPreviews]);

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = "";
  };

  const removeStagedImage = (indexToRemove: number) => {
    // Revoke object URL
    URL.revokeObjectURL(uploadPreviews[indexToRemove]);
    setUploadPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (!category) {
      toast.error("Please select a product category.");
      return;
    }
    if (images.length === 0 && selectedFiles.length === 0) {
      toast.error("Please select or upload at least one product image.");
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size.");
      return;
    }

    let uploadedUrls: string[] = [];

    try {
      setLoading(true);

      // Perform Cloudinary upload if there are staged local files
      if (selectedFiles.length > 0) {
        setUploading(true);
        console.log("Upload start: uploading staged files to Cloudinary..."); // Console log: Upload start
        const uploadToastId = toast.loading("Uploading images to Cloudinary...");

        try {
          uploadedUrls = await uploadImages(selectedFiles);
          console.log("Cloudinary response secure URLs:", uploadedUrls); // Console log: Cloudinary response
          toast.success("Images uploaded successfully to Cloudinary!", { id: uploadToastId });
        } catch (uploadErr: any) {
          console.error("Cloudinary upload failure:", uploadErr);
          toast.error(uploadErr.message || "Failed to upload images. Please try again.", { id: uploadToastId });
          setUploading(false);
          setLoading(false);
          return;
        }
        setUploading(false);
      }

      const finalImages = [...images, ...uploadedUrls];

      const productPayload = {
        name: name.trim(),
        description: description.trim(),
        price: Number(price), // Active selling price (salePrice)
        category: category,
        images: finalImages,
        sizeType,
        sizes: selectedSizes,
        stockStatus,
        originalPrice: originalPrice ? Number(originalPrice) : null,
        salePrice: Number(price),
        isBestSeller,
      };

      console.log("Firestore save payload:", productPayload); // Console log: Firestore save
      await addProduct(productPayload);

      toast.success("Product Added Successfully");
      
      // Revoke preview URLs
      uploadPreviews.forEach((url) => URL.revokeObjectURL(url));

      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Failed to add product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sizeOptions = sizeType === "LETTER" ? LETTER_SIZES : NUMERIC_SIZES;

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-neutral-400 hover:text-black font-bold text-xs uppercase tracking-wider transition">
              Control Panel
            </Link>
            <span className="text-neutral-300 text-sm">/</span>
            <Link href="/admin/products" className="text-neutral-450 hover:text-black font-bold text-xs uppercase tracking-wider transition">
              Products
            </Link>
            <span className="text-neutral-300 text-sm">/</span>
            <span className="font-bold text-xs uppercase tracking-wider text-[#38BDF8]">New</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase mt-2">
            Create Product
          </h1>
        </div>

        {/* Form Container */}
        <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Product Name
              </label>
              <input
                type="text"
                placeholder="e.g. Premium Cotton Cordset"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition font-medium text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Product Description
              </label>
              <textarea
                placeholder="Describe your premium streetwear items..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition h-32 resize-none text-sm font-medium"
              />
            </div>

            {/* Pricing Section (Regular vs Sale Price) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Sale Price / Active Price (INR) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1499"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition font-medium text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Original Price / MRP (INR, Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1999"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition font-medium text-sm"
                />
              </div>
            </div>

            {/* Inventory Status & Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Stock Status
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as any)}
                  className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer font-bold text-sm"
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-[#38BDF8] focus:ring-[#38BDF8] cursor-pointer"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Mark as Best Seller
                  </span>
                </label>
              </div>
            </div>

            {/* Category dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer font-bold text-sm"
                required
              >
                <option value="">Select Category</option>
                <option value="t-shirt">T-Shirt</option>
                <option value="shirt">Shirt</option>
                <option value="pant">Pant</option>
                <option value="track pant">Track Pant</option>
                <option value="3/4 pant">3/4 Pant</option>
                <option value="cord set">Cord Set</option>
              </select>
            </div>

            {/* Product Images Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Product Images
              </label>

              {/* Dotted upload dropzone area */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-neutral-50/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="text-2xl mb-2">📷</span>
                    <p className="mb-1 text-xs text-[#666666] font-bold">
                      Click to upload images
                    </p>
                    <p className="text-[10px] text-neutral-400 font-semibold">
                      PNG, JPG, JPEG (Select multiple)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Images Grid */}
              {(images.length > 0 || uploadPreviews.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
                  {/* Uploaded cloud URLs */}
                  {images.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                      <img
                        src={url}
                        alt={`Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-red-600 text-white rounded-full p-1 text-xs transition cursor-pointer flex items-center justify-center w-5 h-5 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Local staged files ready for upload */}
                  {uploadPreviews.map((url, idx) => (
                    <div key={`staged-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-sky-50/10 shadow-sm">
                      <img
                        src={url}
                        alt={`Staged image preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Badge indicating it is local/staged */}
                      <span className="absolute bottom-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Staged
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStagedImage(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-red-600 text-white rounded-full p-1 text-xs transition cursor-pointer flex items-center justify-center w-5 h-5 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Size Type
              </label>
              <select
                value={sizeType}
                onChange={handleSizeTypeChange}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer font-bold text-sm"
              >
                <option value="LETTER">LETTER (XS, S, M, L...)</option>
                <option value="NUMERIC">NUMERIC (KIDS 16 - 40)</option>
              </select>
            </div>

            {/* Sizes checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const isChecked = selectedSizes.includes(size);
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => handleSizeChange(size)}
                      className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        isChecked
                          ? "bg-[#38BDF8] text-black border-[#38BDF8]"
                          : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >
                      {formatSize(size)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4 border-t border-neutral-200">
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-[#38BDF8] hover:text-black transition shadow-sm disabled:bg-neutral-300 disabled:text-neutral-500 text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </button>
              <Link
                href="/admin/products"
                className="flex-1 border border-neutral-300 text-black text-center py-4 rounded-xl font-bold hover:bg-neutral-100 transition text-sm uppercase tracking-wider flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </AdminGuard>
  );
}
