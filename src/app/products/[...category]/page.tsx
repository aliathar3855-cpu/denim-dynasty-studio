"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";

import { db } from "@/firebase/config";

export default function CategoryProducts() {

  const { category } = useParams();
  const { cart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProducts = async () => {
      try {
        if (!category) return;

        const snapshot = await getDocs(query(collection(db, "products")));
        let data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const categoryStr = Array.isArray(category) ? category.join("/") : category || "";
        const cleanCat = decodeURIComponent(categoryStr).toLowerCase().trim();

        if (cleanCat === "new-arrivals" || cleanCat === "new arrivals") {
          data = data.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
        } else {
          data = data.filter((product: any) => {
            const prodCat = (product.category || "").toLowerCase().trim();
            
            // Support exact category matching
            if (cleanCat === "t-shirts" || cleanCat === "t-shirt") {
              return prodCat === "t-shirt";
            }
            if (cleanCat === "shirts" || cleanCat === "shirt") {
              return prodCat === "shirt";
            }
            if (cleanCat === "pants" || cleanCat === "pant") {
              if (cleanCat === "pant") return prodCat === "pant";
              return prodCat === "pant" || prodCat === "track pant" || prodCat === "3/4 pant";
            }
            if (cleanCat === "track pant" || cleanCat === "track-pant") {
              return prodCat === "track pant";
            }
            if (cleanCat === "3/4 pant" || cleanCat === "3-4-pant" || cleanCat === "3/4-pant") {
              return prodCat === "3/4 pant";
            }
            if (cleanCat === "cord set" || cleanCat === "cord-set") {
              return prodCat === "cord set";
            }
            if (cleanCat === "jeans") {
              return prodCat === "jeans" || prodCat === "jean" || prodCat === "pant";
            }
            if (cleanCat === "jackets" || cleanCat === "jacket") {
              return prodCat === "jackets" || prodCat === "jacket" || prodCat === "cord set";
            }
            
            return prodCat === cleanCat;
          });
        }

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

  const categoryStr = Array.isArray(category) ? category.join("/") : category || "";
  const displayCategory = decodeURIComponent(categoryStr).replace("-", " ");

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
      


      <h1 className="text-4xl font-black mb-10 capitalize tracking-tight text-[#111111]">
        {displayCategory} Collection
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
              className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full group"
            >
              <Link href={`/product/${product.id}`} className="block cursor-pointer overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-[250px] object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </Link>

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <Link href={`/product/${product.id}`} className="block cursor-pointer hover:text-[#38BDF8] transition-colors">
                    <h2 className="text-lg font-bold text-[#111111] line-clamp-1">
                      {product.name}
                    </h2>
                  </Link>
                  <p className="text-[#666666] mt-2 font-semibold text-sm">
                    ₹{product.price}
                  </p>
                </div>

                <Link
                  href={`/product/${product.id}`}
                  className="mt-4 block w-full bg-[#38BDF8] text-black py-3 rounded-xl font-bold text-center hover:bg-[#0ea5e9] hover:text-white transition text-sm cursor-pointer shadow-sm"
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
