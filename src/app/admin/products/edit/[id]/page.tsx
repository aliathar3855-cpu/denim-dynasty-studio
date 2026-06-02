"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { getProductById, updateProduct } from "@/lib/products";
import { uploadImages } from "@/lib/upload";
import { toast } from "react-hot-toast";

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const NUMERIC_SIZES = ["28", "30", "32", "34", "36", "38", "40", "42", "44"];

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [sizeType, setSizeType] = useState<"LETTER" | "NUMERIC">("LETTER");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const prod = await getProductById(id);
        if (prod) {
          setName(prod.name || "");
          setPrice(prod.price?.toString() || "");
          setImages(prod.images || []);
          setSizeType(prod.sizeType || "LETTER");
          setSelectedSizes(prod.sizes || []);
        } else {
          toast.error("Product not found");
          router.push("/admin/products");
        }
      } catch (err) {
        console.error("Error loading product details:", err);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  const handleSizeChange = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSizeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSizeType(e.target.value as "LETTER" | "NUMERIC");
    setSelectedSizes([]); // Reset selected sizes when size type changes
  };

  // Image Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Generate object URLs for immediate preview
    const localPreviews = fileList.map((file) => URL.createObjectURL(file));
    setUploadPreviews(localPreviews);
    setUploading(true);

    try {
      const urls = await uploadImages(fileList);
      setImages((prev) => [...prev, ...urls]);
      toast.success(`${urls.length} image(s) uploaded successfully!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload images.");
    } finally {
      // Clean up object URLs
      localPreviews.forEach((url) => URL.revokeObjectURL(url));
      setUploadPreviews([]);
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error("Product ID is missing.");
      return;
    }
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (images.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size.");
      return;
    }

    try {
      setSubmitting(true);

      const updatePayload = {
        name: name.trim(),
        price: Number(price),
        images,
        sizeType,
        sizes: selectedSizes,
      };

      await updateProduct(id, updatePayload);

      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product. Please try again.");
    } finally {
      setSubmitting(false);
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
            <span className="font-bold text-xs uppercase tracking-wider text-[#38BDF8]">Edit</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase mt-2">
            Edit Product
          </h1>
        </div>

        {/* Form Container */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <p className="text-neutral-500 text-sm">Loading product details...</p>
          </div>
        ) : (
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

              {/* Price */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Price (INR)
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

              {/* Product Images Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Product Images
                </label>

                {/* Upload Zone */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-neutral-50/50 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="text-2xl mb-2">📷</span>
                      <p className="mb-1 text-xs text-[#666666] font-bold">
                        Click to upload more images
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
                    {/* Existing uploaded images */}
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

                    {/* Staged new images uploading */}
                    {uploadPreviews.map((url, idx) => (
                      <div key={`staged-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                        <img
                          src={url}
                          alt="Uploading preview"
                          className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#38BDF8] mb-1"></div>
                          <span className="text-[8px] text-black font-extrabold uppercase bg-white/80 px-1 rounded tracking-wide">
                            Uploading...
                          </span>
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
                  <option value="NUMERIC">NUMERIC (28, 30, 32...)</option>
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
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-[#38BDF8] hover:text-black transition shadow-sm disabled:bg-neutral-300 disabled:text-neutral-500 text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Product"
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
        )}
      </main>
    </AdminGuard>
  );
}
