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

interface ImageItem {
  id: string;
  type: "uploaded" | "staged";
  url: string;
  file?: File;
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // Acts as Sale Price/Regular Price
  const [originalPrice, setOriginalPrice] = useState(""); // MRP (Optional)
  const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("IN_STOCK");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("All Season");
  
  // Unified images and upload state
  const [items, setItems] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sizeType, setSizeType] = useState<"LETTER" | "NUMERIC">("LETTER");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Keep a ref of items for unmount cleanup
  const itemsRef = React.useRef<ImageItem[]>([]);
  itemsRef.current = items;

  // Clean up preview object URLs to avoid memory leaks on component unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.type === "staged") {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

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
    console.log("Selected file(s):", fileList);

    // Validation: Maximum 10 images
    if (items.length + fileList.length > 10) {
      toast.error("You can upload a maximum of 10 product images.");
      return;
    }

    const newItems: ImageItem[] = fileList.map((file) => {
      const id = `staged-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
      const url = URL.createObjectURL(file);
      return { id, type: "staged", url, file };
    });

    setItems((prev) => [...prev, ...newItems]);

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = "";
  };

  const removeImageItem = (idToRemove: string) => {
    setItems((prev) => {
      const item = prev.find((x) => x.id === idToRemove);
      if (item && item.type === "staged") {
        URL.revokeObjectURL(item.url);
      }
      return prev.filter((x) => x.id !== idToRemove);
    });
  };

  const moveImageItem = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const newItems = [...prev];
      const temp = newItems[index];
      newItems[index] = newItems[targetIndex];
      newItems[targetIndex] = temp;
      return newItems;
    });
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
    
    // Validation: Minimum 1 image, Maximum 10 images
    if (items.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }
    if (items.length > 10) {
      toast.error("You can upload a maximum of 10 product images.");
      return;
    }
    
    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size.");
      return;
    }

    let uploadedUrls: string[] = [];
    const stagedItems = items.filter((x) => x.type === "staged");

    try {
      setLoading(true);

      // Perform Cloudinary upload if there are staged local files
      if (stagedItems.length > 0) {
        setUploading(true);
        console.log("Upload start: uploading staged files to Cloudinary...");
        const uploadToastId = toast.loading(`Uploading ${stagedItems.length} image(s) to Cloudinary...`);

        try {
          const filesToUpload = stagedItems.map((x) => x.file!);
          uploadedUrls = await uploadImages(filesToUpload);
          console.log("Cloudinary response secure URLs:", uploadedUrls);
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

      let uploadIndex = 0;
      const finalImages = items.map((item) => {
        if (item.type === "uploaded") {
          return item.url;
        } else {
          const url = uploadedUrls[uploadIndex];
          uploadIndex++;
          return url;
        }
      });

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
        season,
      };

      console.log("Firestore save payload:", productPayload); // Console log: Firestore save
      await addProduct(productPayload);

      toast.success("Product Added Successfully");
      
      // Revoke preview URLs
      items.forEach((item) => {
        if (item.type === "staged") {
          URL.revokeObjectURL(item.url);
        }
      });

      router.refresh();
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

            {/* Season dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer font-bold text-sm"
                required
              >
                <option value="All Season">All Season</option>
                <option value="Summer">Summer</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Festive">Festive</option>
                <option value="Winter">Winter</option>
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
                      Click to upload images (1 to 10 images)
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
              {items.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`relative group aspect-square rounded-2xl overflow-hidden border bg-neutral-50 shadow-sm transition flex flex-col justify-between ${
                        item.type === "staged" ? "border-amber-250 ring-2 ring-amber-500/10" : "border-neutral-200"
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badge in top-left showing rank / number */}
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {idx + 1}
                      </span>

                      {/* Staged local file badge */}
                      {item.type === "staged" && (
                        <span className="absolute bottom-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          Staged
                        </span>
                      )}

                      {/* Hover action overlay or bottom action bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between gap-1">
                        <div className="flex gap-1">
                          {/* Move Left */}
                          <button
                            type="button"
                            onClick={() => moveImageItem(idx, "left")}
                            disabled={idx === 0}
                            className="bg-white/90 hover:bg-white text-black p-1 rounded-lg text-xs transition disabled:opacity-40 disabled:hover:bg-white/90 cursor-pointer flex items-center justify-center w-6 h-6"
                            title="Move Left"
                          >
                            ←
                          </button>
                          {/* Move Right */}
                          <button
                            type="button"
                            onClick={() => moveImageItem(idx, "right")}
                            disabled={idx === items.length - 1}
                            className="bg-white/90 hover:bg-white text-black p-1 rounded-lg text-xs transition disabled:opacity-40 disabled:hover:bg-white/90 cursor-pointer flex items-center justify-center w-6 h-6"
                            title="Move Right"
                          >
                            →
                          </button>
                        </div>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeImageItem(item.id)}
                          className="bg-red-500/90 hover:bg-red-650 text-white p-1 rounded-lg text-xs transition cursor-pointer flex items-center justify-center w-6 h-6 font-bold"
                          title="Remove Image"
                        >
                          ✕
                        </button>
                      </div>
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
