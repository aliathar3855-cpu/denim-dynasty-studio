"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/firebase/config";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "products")
      );

      const productList: any[] = [];

      querySnapshot.forEach((docItem) => {
        productList.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });

      setProducts(productList);
    } catch (error) {
      console.error(error);
    }
  };

  // AUTH CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.push("/admin/login");
        } else {
          setCheckingAuth(false);
          fetchProducts();
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // LOGOUT
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error(error);
    }
  };

  // DELETE PRODUCT
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "Delete this product?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", id));

      alert("Product Deleted");

      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  // ADD PRODUCT
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!image) {
      alert("Please select image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("file", image);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("category", category);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Product Added Successfully");

        setName("");
        setPrice("");
        setImage(null);
        setCategory("");

        fetchProducts();
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

  // LOADING SCREEN
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Checking Authentication...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#111111]">
            Product Manager
          </h1>
          <p className="text-[#666666] text-sm mt-1">Add, update, or remove shop inventory items.</p>
        </div>

        <button
          onClick={handleLogout}
          className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold transition text-sm cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* PRODUCT FORM */}
      <div className="max-w-xl mb-16 bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8">
        <h3 className="text-lg font-bold text-[#111111] mb-6">Create New Merchandise</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
          />

          <input
            type="file"
            onChange={(e: any) => setImage(e.target.files[0])}
            className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-sm text-[#666666]"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-[#111111] text-white px-8 py-4 rounded-xl font-bold hover:bg-neutral-800 transition cursor-pointer"
          >
            {loading ? "Uploading..." : "Add Product"}
          </button>
        </form>
      </div>

      {/* PRODUCTS */}
      <h2 className="text-3xl font-black mb-8 tracking-tight text-[#111111]">
        All Products
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-[300px] object-cover"
            />

            <div className="p-6 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#111111]">
                  {product.name}
                </h3>

                <p className="text-[#666666] mt-2 font-semibold">
                  ₹{product.price}
                </p>

                <p className="text-neutral-400 mt-1 text-sm font-medium">
                  {product.category}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Link
                  href={`/admin/edit-product/${product.id}`}
                  className="flex-1 bg-[#111111] text-white py-3 rounded-xl font-semibold text-center hover:bg-neutral-800 transition flex items-center justify-center text-sm"
                >
                  Edit Product
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl font-semibold transition text-sm cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </main>
  );
}