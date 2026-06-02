"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import AdminGuard from "@/components/AdminGuard";
import { toast } from "react-hot-toast";
import { formatSize } from "@/lib/products";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [sizeType, setSizeType] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const letterSizesList = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const numericSizesList = ["16", "18", "20", "22", "24", "26", "28", "30", "32", "34", "36", "38", "40"];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Fetch product on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, "products", id.toString());
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setName(data.name || "");
          setPrice(data.price?.toString() || "");
          setCategory(data.category || "");
          setDescription(data.description || "");
          setCurrentImageUrl(data.imageUrl || "");
          setSizeType(data.sizeType || "");
          setSelectedSizes(data.sizes || []);
        } else {
          toast.error("Product not found");
          router.push("/admin");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error("Product ID is missing");
      return;
    }

    if (!name || !price || !category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("id", id);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("sizeType", sizeType);
      formData.append("sizes", JSON.stringify(selectedSizes));
      if (image) {
        formData.append("file", image);
      }

      const res = await fetch("/api/edit-product", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Product Updated Successfully ✅");
        router.push("/admin");
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading Product Data...</h1>
        </div>
      </main>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-10 font-sans max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between border-b border-neutral-200 pb-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#111111]">
              Edit Product
            </h1>
            <p className="text-[#666666] text-sm mt-1">Modify details for this merchandise item.</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-[#f8f8f8] border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 px-4 py-2 rounded-xl text-sm font-semibold transition text-[#111111] cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto bg-white border border-neutral-200 shadow-sm rounded-3xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* NAME */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
                required
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Price (INR) *
              </label>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
                required
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer"
                required
              >
                <option value="">Select Category</option>
                <option value="T-Shirt">T-Shirt</option>
                <option value="Shirt">Shirt</option>
                <option value="Pant">Pant</option>
                <option value="Track Pant">Track Pant</option>
                <option value="Cord Set">Cord Set</option>
                <option value="3/4 Pant">3/4 Pant</option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Product Description
              </label>
              <textarea
                placeholder="Product Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition h-32"
              />
            </div>

            {/* SIZE MANAGEMENT */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Size Type
              </label>
              <select
                value={sizeType}
                onChange={(e) => {
                  setSizeType(e.target.value);
                  setSelectedSizes([]);
                }}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer"
              >
                <option value="">No Sizes (One Size / Free Size)</option>
                <option value="letter">Letter Sizes (XS, S, M, L, ...)</option>
                <option value="numeric">Numeric Sizes (28, 30, 32, ...)</option>
              </select>
            </div>

            {sizeType && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
                  Select Available Sizes
                </label>
                <div className="flex flex-wrap gap-3">
                  {(sizeType === "letter" ? letterSizesList : numericSizesList).map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <label
                        key={size}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 select-none ${
                          isChecked
                            ? "bg-[#111111] text-white border-black"
                            : "bg-white text-[#666666] border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSizeToggle(size)}
                          className="hidden"
                        />
                        {formatSize(size)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* IMAGE PREVIEWS & FILE INPUT */}
            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Current Image
                </label>
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Current Product"
                    className="w-full h-40 object-cover rounded-2xl border border-neutral-200"
                  />
                ) : (
                  <div className="w-full h-40 bg-[#f8f8f8] rounded-2xl border border-neutral-200 flex items-center justify-center text-[#666666] text-xs">
                    No image available
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  New Preview
                </label>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="New Preview"
                    className="w-full h-40 object-cover rounded-2xl border border-neutral-300 border-dashed"
                  />
                ) : (
                  <div className="w-full h-40 bg-[#f8f8f8]/50 rounded-2xl border border-neutral-300 border-dashed flex items-center justify-center text-neutral-400 text-xs">
                    Optional Image Update
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Upload New Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-sm text-[#666666]"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition text-center flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-md"
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Product...
                </>
              ) : (
                "Save Changes"
              )}
            </button>

          </form>
        </div>

      </main>
    </AdminGuard>
  );
}
