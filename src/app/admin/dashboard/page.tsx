"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/config";
import { signOut } from "firebase/auth";
import AdminGuard from "@/components/AdminGuard";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sizeType, setSizeType] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const letterSizesList = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const numericSizesList = ["28", "30", "32", "34", "36", "38", "40", "42", "44"];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!image) {
      alert("Please select image");
      return;
    }

    if (!name || !price || !category) {
      alert("Fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("file", image);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("sizeType", sizeType);
      formData.append("sizes", JSON.stringify(selectedSizes));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Product Added Successfully");

        // RESET ALL FIELDS
        setName("");
        setPrice("");
        setCategory("");
        setDescription("");
        setImage(null);
        setSizeType("");
        setSelectedSizes([]);

        // refresh products if needed
        window.location.reload();
      } else {
        alert("Upload failed");
      }

    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-neutral-200 pb-5">
          <h1 className="text-3xl md:text-4xl font-black text-[#111111] tracking-tight">
            Admin Dashboard
          </h1>

          <button
            onClick={logout}
            className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl font-semibold transition text-sm cursor-pointer"
          >
            Logout
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* NAME */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
              Product Name
            </label>
            <input
              type="text"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
            />
          </div>

          {/* PRICE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
              Price (INR)
            </label>
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition cursor-pointer"
            >
              <option value="">Select Category</option>
              <option value="T-Shirt">T-Shirt</option>
              <option value="Shirt">Shirt</option>
              <option value="Pant">Pant</option>
              <option value="Track Pant">Track Pant</option>
              <option value="Cord Set">Cord Set</option>
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
              Description
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
                      {size}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* IMAGE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e: any) => setImage(e.target.files[0])}
              className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-sm text-[#666666]"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] text-white px-8 py-4 rounded-xl font-bold hover:bg-neutral-800 transition cursor-pointer shadow-md"
          >
            {loading ? "Uploading..." : "Add Product"}
          </button>
        </form>
      </main>
    </AdminGuard>
  );
}