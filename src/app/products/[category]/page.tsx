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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Loading Products...
        </h1>
      </main>
    );

  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl font-bold mb-10 capitalize">
        {category} Products
      </h1>

      {products.length === 0 ? (

        <div className="text-center mt-20">
          <h2 className="text-2xl font-semibold">
            No Products Found
          </h2>
        </div>

      ) : (

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {products.map((product) => (

            <div
              key={product.id}
              className="bg-zinc-900 rounded-3xl overflow-hidden"
            >

              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-[250px] object-cover"
              />

              <div className="p-4">

                <h2 className="text-xl font-bold">
                  {product.name}
                </h2>

                <p className="text-gray-400 mt-2">
                  ₹{product.price}
                </p>

                <Link
                  href={`/product/${product.id}`}
                  className="mt-4 block w-full bg-white text-black py-3 rounded-xl font-semibold text-center"
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