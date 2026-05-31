"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useCart } from "@/context/CartContext";

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        const docRef = doc(
          db,
          "products",
          id.toString()
        );

        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setProduct({
            id: snapshot.id,
            ...snapshot.data(),
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Loading Product...
        </h1>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      <div className="grid md:grid-cols-2 gap-10">

        <div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-[500px] object-cover rounded-3xl"
          />
        </div>

        <div className="flex flex-col justify-center">

          <h1 className="text-5xl font-bold">
            {product.name}
          </h1>

          <p className="text-3xl font-semibold mt-6">
            ₹{product.price}
          </p>

          <p className="text-gray-400 mt-6 text-lg">
            {product.description}
          </p>

        <button
            onClick={() => {
                addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
                });

                setShowToast(true);

                setTimeout(() => {
                setShowToast(false);
                }, 1500);
            }}
            className="mt-8 bg-white text-black py-4 px-8 rounded-xl font-bold hover:bg-gray-200 transition"
            >
            Add To Cart
            </button>

        </div>

      </div>

       {showToast && (
        <div className="fixed bottom-10 right-10 bg-green-500 text-black px-6 py-3 rounded-xl font-bold shadow-lg z-50">
          Added to Cart ✅
        </div>
      )}


    </main>
  );
}