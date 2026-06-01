"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import AdminGuard from "@/components/AdminGuard";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        } else {
          alert("Product not found");
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
      alert("Product ID is missing");
      return;
    }

    if (!name || !price || !category) {
      alert("Please fill all required fields");
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
      if (image) {
        formData.append("file", image);
      }

      const res = await fetch("/api/edit-product", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Product Updated Successfully ✅");
        router.push("/admin");
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <h1 className="text-xl font-bold">Loading Product Data...</h1>
        </div>
      </main>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-zinc-500 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Modify details for this merchandise item.</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* NAME */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-850 outline-none focus:border-zinc-700 transition"
                required
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Price (INR) *
              </label>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-850 outline-none focus:border-zinc-700 transition"
                required
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-850 outline-none focus:border-zinc-700 transition text-zinc-300"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Product Description
              </label>
              <textarea
                placeholder="Product Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-850 outline-none focus:border-zinc-700 transition h-32"
              />
            </div>

            {/* IMAGE PREVIEWS & FILE INPUT */}
            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Current Image
                </label>
                {currentImageUrl ? (
                  <img
                    src={currentImageUrl}
                    alt="Current Product"
                    className="w-full h-40 object-cover rounded-2xl border border-zinc-800"
                  />
                ) : (
                  <div className="w-full h-40 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center text-zinc-650 text-xs">
                    No image available
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  New Preview
                </label>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="New Preview"
                    className="w-full h-40 object-cover rounded-2xl border border-zinc-800 border-dashed"
                  />
                ) : (
                  <div className="w-full h-40 bg-zinc-900/20 rounded-2xl border border-zinc-800 border-dashed flex items-center justify-center text-zinc-500 text-xs">
                    Optional Image Update
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Upload New Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-850 text-sm text-zinc-400"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition text-center flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
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
