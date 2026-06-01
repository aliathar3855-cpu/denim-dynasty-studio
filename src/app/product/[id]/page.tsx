"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

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
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading Product...</h1>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-10 font-sans">
      
      {/* Top Navbar Back Link */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto mb-10 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto items-center">
        <div>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-[500px] object-cover rounded-3xl border border-neutral-200 shadow-sm"
          />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight">
            {product.name}
          </h1>

          <p className="text-3xl font-extrabold text-[#111111] mt-6">
            ₹{product.price}
          </p>

          <p className="text-[#666666] mt-6 text-lg leading-relaxed">
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
            className="mt-8 bg-[#111111] text-white py-4 px-8 rounded-xl font-bold hover:bg-neutral-800 transition shadow-md cursor-pointer"
          >
            Add To Cart
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg z-50">
          Added to Cart ✅
        </div>
      )}

    </main>
  );
}
