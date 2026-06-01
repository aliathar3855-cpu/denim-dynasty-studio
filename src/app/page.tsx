"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { db } from "../firebase/config";

import { collection, getDocs } from "firebase/firestore";

import { useCart } from "@/context/CartContext";

export default function Home() {

  const [products, setProducts] = useState<any[]>([]);
  const { addToCart, cart } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");

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

  const filteredProducts = products
    .filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || descMatch;

      const matchesCategory =
        selectedCategory === "All" ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "low-to-high") {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === "high-to-low") {
        return Number(b.price) - Number(a.price);
      }
      return 0;
    });

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

          <Link href="/order-tracking" className="hover:text-zinc-300 transition">Track Order</Link>

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
        className="px-8 pb-24 max-w-6xl mx-auto"
      >

        <h3 className="text-4xl font-bold mb-12 text-center">
          Featured Products
        </h3>

        {/* Search, Filter, Sort Controls */}
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="w-full md:w-1/2 relative">
              <input
                type="text"
                placeholder="Search premium streetwear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-black border border-zinc-800 rounded-2xl text-sm focus:border-zinc-700 outline-none transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">🔍</span>
            </div>

            {/* Price Sort Dropdown */}
            <div className="w-full md:w-1/4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3.5 bg-black border border-zinc-800 rounded-2xl text-sm text-zinc-400 focus:border-zinc-700 outline-none transition cursor-pointer"
              >
                <option value="default">Sort: Recommended</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="border-t border-zinc-800/60 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-1">Filter Categories</p>
            <div className="flex gap-2.5 overflow-x-auto pb-3 md:pb-0 md:flex-wrap no-scrollbar">
              {["All", ...categories].map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      isActive
                        ? "bg-white text-black border-white font-bold"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/10 border border-zinc-800/40 rounded-3xl">
            <p className="text-zinc-500 text-lg">No premium streetwear products found matching your search filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">

            {filteredProducts.map((product) => (

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
        )}

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