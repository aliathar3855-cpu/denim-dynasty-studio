"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <main className="bg-[#ffffff] text-[#111111] min-h-screen">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <Link href="/" className="flex items-center shrink-0">
          {/* Full Logo - Desktop and Tablet */}
          <div className="hidden sm:block">
            <Image
              src="/logo-full.png"
              alt="Denim Dynasty Studio"
              width={200}
              height={50}
              priority
              className="w-auto h-9 md:h-11 object-contain"
            />
          </div>
          {/* Icon Logo - Mobile */}
          <div className="block sm:hidden">
            <Image
              src="/logo-icon.png"
              alt="Denim Dynasty Studio"
              width={50}
              height={50}
              priority
              className="w-10 h-10 object-contain"
            />
          </div>
        </Link>

        <div className="flex flex-wrap gap-4 md:gap-6 text-sm items-center justify-end">
          <Link href="/" className="text-[#38BDF8] font-bold transition">Home</Link>
          <Link href="/#products" className="text-[#666666] hover:text-[#38BDF8] transition">Shop</Link>
          <Link href="/about" className="text-[#666666] hover:text-[#38BDF8] transition">About</Link>
          <Link href="/contact" className="text-[#666666] hover:text-[#38BDF8] transition">Contact</Link>
          <Link href="/my-orders" className="text-[#666666] hover:text-[#38BDF8] transition">
            My Orders
          </Link>
          <Link
            href="/cart"
            className="bg-[#111111] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition whitespace-nowrap flex items-center gap-2"
          >
            <span>Cart</span>
            <span className="bg-[#38BDF8] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cart.reduce((sum: number, item: any) => sum + item.quantity, 0)}
            </span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="h-[60vh] flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-white to-[#E0F2FE]">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-[#111111]">
          Boys Fashion Store
        </h2>
        <p className="text-[#666666] text-lg max-w-2xl">
          Trendy fashion collection for modern streetwear lovers.
        </p>
        <button 
          onClick={() => {
            const el = document.getElementById("products");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-8 bg-[#38BDF8] text-black px-8 py-3 rounded-full font-bold hover:bg-[#0ea5e9] hover:text-white transition cursor-pointer shadow-md"
        >
          Shop Now
        </button>
      </section>



      {/* Categories */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <h3 className="text-3xl font-black mb-10 text-center tracking-tight text-[#111111]">
          Shop By Category
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { name: "Cord Set", image: "/category-boys-cordset.png" },
            { name: "Shirt", image: "/category-boys-shirts.png" },
            { name: "T-Shirt", image: "/category-boys-tshirts.png" },
            { name: "Pant", image: "/category-boys-pants.png" },
            { name: "Track Pant", image: "/category-boys-trackpant.png" },
            { name: "3/4 Pant", image: "/category-boys-threequarterpant.png" },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/products/${encodeURIComponent(cat.name.toLowerCase())}`}
              className="group relative h-[220px] md:h-[280px] overflow-hidden rounded-3xl border border-neutral-200 hover:border-[#38BDF8] shadow-sm block cursor-pointer transition-all duration-300"
            >
              <div className="absolute inset-0 bg-neutral-100 animate-pulse group-hover:scale-105 transition-transform duration-700 ease-out z-0" />
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent z-20 transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-30">
                <h4 className="text-white group-hover:text-[#38BDF8] text-lg md:text-xl font-bold tracking-wide text-center transition-colors duration-300">
                  {cat.name}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="bg-[#E0F2FE] py-24 w-full"
      >
        <div className="max-w-6xl mx-auto px-8">
          <h3 className="text-3xl font-bold mb-10 text-center text-[#111111]">
            Featured Products
          </h3>

          {/* Search, Filter, Sort Controls */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 space-y-6 mb-12 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="w-full md:w-1/2 relative">
              <input
                type="text"
                placeholder="Search premium streetwear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm focus:border-neutral-500 outline-none text-[#111111] transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">🔍</span>
            </div>

            {/* Price Sort Dropdown */}
            <div className="w-full md:w-1/4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-[#666666] focus:border-neutral-500 outline-none transition cursor-pointer"
              >
                <option value="default">Sort: Recommended</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="border-t border-neutral-200 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#666666] mb-3 px-1">
              Filter Categories
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-3 md:pb-0 md:flex-wrap no-scrollbar">
              {["All", ...categories].map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      isActive
                        ? "bg-[#38BDF8] text-black border-[#38BDF8] font-bold shadow-sm"
                        : "bg-white border-neutral-200 text-[#666666] hover:text-[#38BDF8] hover:border-[#38BDF8]/40"
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
          <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
            <p className="text-[#666666] text-lg">
              No premium streetwear products found matching your search filters.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-[350px] object-cover"
                />

                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-[#111111]">
                      {product.name}
                    </h4>
                    <p className="text-[#666666] mt-2 font-semibold">
                      ₹{product.price}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-[#38BDF8] text-black py-3 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition text-sm cursor-pointer shadow-sm"
                    >
                      Add To Cart
                    </button>
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 bg-[#f8f8f8] text-[#111111] border border-neutral-250 py-3 rounded-xl font-bold text-center hover:bg-neutral-100 transition text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="border-t border-neutral-200 bg-[#E0F2FE] py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-100 hover:border-[#38BDF8]/30 hover:shadow-sm transition-all duration-300">
            <div className="text-[#38BDF8] mb-3.5 p-3.5 bg-white rounded-full shadow-sm border border-neutral-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm6.45 6.45a2.886 2.886 0 0 0 0 4.1M13.75 12h.008v.008h-.008V12Zm0 2.25h.008v.008h-.008v-.008ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0-9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path>
              </svg>
            </div>
            <span className="text-xs md:text-sm font-bold text-[#111111] tracking-wide leading-snug">
              ✓ Cash on Delivery Available
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-100 hover:border-[#38BDF8]/30 hover:shadow-sm transition-all duration-300">
            <div className="text-[#38BDF8] mb-3.5 p-3.5 bg-white rounded-full shadow-sm border border-neutral-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.266-.852-.676-1.03l-2.456-1.07A1.125 1.125 0 0 0 14.25 9.75h-2.25V4.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h1.5"></path>
              </svg>
            </div>
            <span className="text-xs md:text-sm font-bold text-[#111111] tracking-wide leading-snug">
              ✓ Fast Shipping Across India
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-100 hover:border-[#38BDF8]/30 hover:shadow-sm transition-all duration-300">
            <div className="text-[#38BDF8] mb-3.5 p-3.5 bg-white rounded-full shadow-sm border border-neutral-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path>
              </svg>
            </div>
            <span className="text-xs md:text-sm font-bold text-[#111111] tracking-wide leading-snug">
              ✓ 100% Secure Payments
            </span>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-100 hover:border-[#38BDF8]/30 hover:shadow-sm transition-all duration-300">
            <div className="text-[#38BDF8] mb-3.5 p-3.5 bg-white rounded-full shadow-sm border border-neutral-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"></path>
              </svg>
            </div>
            <span className="text-xs md:text-sm font-bold text-[#111111] tracking-wide leading-snug">
              ✓ Easy Returns & Customer Support
            </span>
          </div>

        </div>
      </section>



      {/* WhatsApp Button */}
      <a
        href="https://wa.me/917003951437"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition z-50 cursor-pointer"
      >
        WhatsApp
      </a>



    </main>
  );
}