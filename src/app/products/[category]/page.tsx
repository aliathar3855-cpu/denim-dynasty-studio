"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/config";

export default function CategoryProducts() {

  const { category } = useParams();

  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        if (!category) return;

        const q = query(
          collection(db, "products"),
          where("category", "==", category?.toString())
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(data);

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

    fetchProducts();

  }, [category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading Products...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-10 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      <h1 className="text-4xl font-black mb-10 capitalize tracking-tight text-[#111111]">
        {category} Collection
      </h1>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
          <h2 className="text-xl font-bold text-[#666666]">
            No Products Found
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-[250px] object-cover"
              />

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#111111] line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-[#666666] mt-2 font-semibold text-sm">
                    ₹{product.price}
                  </p>
                </div>

                <Link
                  href={`/product/${product.id}`}
                  className="mt-4 block w-full bg-[#111111] text-white py-3 rounded-xl font-bold text-center hover:bg-neutral-800 transition text-sm cursor-pointer"
                >
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );

}