"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { db } from "../firebase/config";

import { collection, getDocs } from "firebase/firestore";

import { useCart } from "@/context/CartContext";

export default function Home() {

  const [products, setProducts] = useState<any[]>([]);

  const { addToCart, cart } = useCart();

  const categories = [
    "Cord Set",
    "Shirt",
    "T-Shirt",
    "Pant",
    "Track Pant",
    "3/4 Pant",
  ];

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const querySnapshot = await getDocs(
          collection(db, "products")
        );

        const productList: any[] = [];

        querySnapshot.forEach((doc) => {

          productList.push({
            id: doc.id,
            ...doc.data(),
          });

        });

        setProducts(productList);

      } catch (error) {

        console.error(error);

      }

    };

    fetchProducts();

  }, []);

  return (
    <main className="bg-black text-white min-h-screen">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">

        <h1 className="text-2xl font-bold tracking-wide">
          DENIM DYNASTY STUDIO
        </h1>

        <div className="flex gap-6 text-sm items-center">

          <a href="#">Home</a>

          <a href="#products">Shop</a>

          <a href="#">Contact</a>

          <Link
            href="/cart"
            className="bg-white text-black px-4 py-2 rounded-full font-semibold"
          >
            Cart ({cart.length})
          </Link>

        </div>

      </nav>

      {/* Hero */}
      <section className="h-[75vh] flex flex-col items-center justify-center text-center px-6">

        <h2 className="text-6xl md:text-7xl font-bold mb-6">
          Boys Fashion Store
        </h2>

        <p className="text-gray-400 text-lg max-w-2xl">
          Trendy fashion collection for modern streetwear lovers.
        </p>

        <button className="mt-8 bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition">
          Shop Now
        </button>

      </section>

      {/* Categories */}
      <section className="px-8 pb-24">

        <h3 className="text-4xl font-bold mb-12 text-center">
          Categories
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

          {categories.map((item) => (

            <Link
              key={item}
              href={`/products/${item.toLowerCase()}`}
            >

              <div className="bg-zinc-900 hover:bg-zinc-800 hover:scale-105 transition rounded-3xl p-10 text-center cursor-pointer">

                <h4 className="text-2xl font-semibold">
                  {item}
                </h4>

              </div>

            </Link>

          ))}

        </div>

      </section>

      {/* Products */}
      <section
        id="products"
        className="px-8 pb-24"
      >

        <h3 className="text-4xl font-bold mb-12 text-center">
          Featured Products
        </h3>

        <div className="grid md:grid-cols-3 gap-8">

          {products.map((product) => (

            <div
              key={product.id}
              className="bg-zinc-900 rounded-3xl overflow-hidden hover:scale-105 transition"
            >

              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-[350px] object-cover"
              />

              <div className="p-6">

                <h4 className="text-2xl font-semibold">
                  {product.name}
                </h4>

                <p className="text-gray-400 mt-2">
                  ₹{product.price}
                </p>

                <div className="flex gap-3 mt-5">

                  <button
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    Add To Cart
                  </button>

                  <Link
                    href={`/product/${product.id}`}
                    className="flex-1 bg-zinc-800 py-3 rounded-xl font-semibold text-center hover:bg-zinc-700 transition"
                  >
                    View
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/911234567890"
        target="_blank"
        className="fixed bottom-5 right-5 bg-green-500 px-5 py-3 rounded-full font-semibold"
      >
        WhatsApp
      </a>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 text-center text-gray-500">

        <p>© 2026 Denim Dynasty Studio</p>

        <div className="flex justify-center gap-6 mt-4">

          <a href="#">Instagram</a>

          <a href="#">WhatsApp</a>

          <a href="#">Facebook</a>

        </div>

      </footer>

    </main>
  );
}