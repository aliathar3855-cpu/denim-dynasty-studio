"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

    const logout = () => {
    localStorage.removeItem("admin");
    router.push("/admin-login");
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-10">
        <div className="flex items-center justify-between mb-8">

      <h1 className="text-3xl md:text-4xl font-bold mb-8">
        Admin Dashboard
      </h1>

      <button
        onClick={logout}
        className="bg-red-500 px-4 py-2 rounded-xl font-semibold" 
        >
        Logout
        </button>
        </div>

   <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6"
      >

        {/* NAME */}
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        />

        {/* PRICE */}
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        />

        {/* CATEGORY */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        >
          <option value="">Select Category</option>
          <option value="T-Shirt">T-Shirt</option>
          <option value="Shirt">Shirt</option>
          <option value="Pant">Pant</option>
          <option value="Track Pant">Track Pant</option>
          <option value="Cord Set">Cord Set</option>
        </select>

        {/* DESCRIPTION */}
        <textarea
          placeholder="Product Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none h-32"
        />

        {/* IMAGE */}
        <input
          type="file"
          accept="image/*"
          onChange={(e: any) => setImage(e.target.files[0])}
          className="w-full p-4 rounded-xl bg-zinc-900"
        />

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>

      </form>

    </main>
  );
}