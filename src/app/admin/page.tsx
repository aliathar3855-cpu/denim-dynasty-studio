"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

import { auth, db } from "@/firebase/config";

export default function DashboardPage() {

  const router = useRouter();

  const [name, setName] = useState("");

  const [price, setPrice] = useState("");

  const [image, setImage] = useState<File | null>(null);

  const [products, setProducts] = useState<any[]>([]);

  const [category, setCategory] = useState("");

  const [loading, setLoading] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) {

        router.push("/admin");

      } else {

        setCheckingAuth(false);

        fetchProducts();

      }

    });

    return () => unsubscribe();

  }, [router]);

  const fetchProducts = async () => {

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

  };

  const handleLogout = async () => {

    await signOut(auth);

    router.push("/admin");

  };

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

        await fetchProducts(); 

        router.refresh(); 

      }

    } catch (error) {

      console.error(error);

      alert("Something went wrong");

    } finally {

      setLoading(false);

    }

  };

  if (checkingAuth) {

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Checking Authentication...
        </h1>
      </main>
    );

  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <div className="flex items-center justify-between mb-10">

        <h1 className="text-4xl font-bold">
          Admin Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-5 py-3 rounded-xl font-semibold"
        >
          Logout
        </button>

      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 mb-16"
      >

        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        />

        <input
          type="file"
          onChange={(e: any) => setImage(e.target.files[0])}
          className="w-full p-4 rounded-xl bg-zinc-900"
        />

        <input
            type="text"
            placeholder="Category (e.g. shoes)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-900 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-8 py-4 rounded-xl font-bold"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>

      </form>

      <h2 className="text-3xl font-bold mb-8">
        All Products
      </h2>

      <div className="grid md:grid-cols-3 gap-8">

        {products.map((product) => (
          <div
            key={product.id}
            className="bg-zinc-900 rounded-3xl overflow-hidden"
          >

            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-[300px] object-cover"
            />

            <div className="p-6">

              <h3 className="text-2xl font-bold">
                {product.name}
              </h3>

              <p className="text-gray-400 mt-2">
                ₹{product.price}
              </p>

              <button
                onClick={() => handleDelete(product.id)}
                className="mt-5 w-full bg-red-500 py-3 rounded-xl font-semibold"
              >
                Delete Product
              </button>

            </div>

          </div>
        ))}

      </div>

    </main>
  );
}