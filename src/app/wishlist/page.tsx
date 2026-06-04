"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/context/WishlistContext";
import { getProductById } from "@/lib/products";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { getOptimizedImageUrl } from "@/lib/cloudinaryHelper";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      try {
        if (wishlist.length === 0) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        const resolved = await Promise.all(
          wishlist.map(async (id) => {
            const product = await getProductById(id);
            if (product) {
              return {
                id,
                ...product,
                imageUrl: product.images?.[0] || product.imageUrl || "/placeholder-product.png",
              };
            }
            return null;
          })
        );

        setWishlistItems(resolved.filter((item): item is any => item !== null));
      } catch (err) {
        console.error("Failed to load wishlist items:", err);
        toast.error("Error loading wishlist items");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading Wishlist...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111] uppercase">
        My Wishlist
      </h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
          <span className="text-5xl block mb-6">❤️</span>
          <h2 className="text-2xl font-bold text-[#666666] mb-6">
            Your wishlist is empty
          </h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto mb-8 font-medium">
            Browse our premium streetwear and denim collections to save your favorite clothing items!
          </p>
          <Link href="/" className="bg-[#38BDF8] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-md inline-block uppercase text-xs tracking-wider">
            Discover Styles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map((product) => {
            const showDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercent = showDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
            return (
              <div
                key={product.id}
                className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full group relative"
              >
                <div className="relative">
                  {/* Remove Button Overlay */}
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-red-50 text-red-500 hover:text-red-650 p-2 rounded-full shadow-sm transition cursor-pointer select-none active:scale-95"
                    title="Remove from Wishlist"
                  >
                    ✕
                  </button>

                  <Link href={`/product/${product.id}`} className="block cursor-pointer overflow-hidden relative aspect-square">
                    <img
                      src={getOptimizedImageUrl(product.imageUrl, 400)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </Link>

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                    {product.createdAt?.seconds && (Date.now() - product.createdAt.seconds * 1000 < 14 * 24 * 60 * 60 * 1000) && (
                      <span className="bg-green-600 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        NEW
                      </span>
                    )}
                    {product.featured && (
                      <span className="bg-yellow-500 text-black text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        FEATURED
                      </span>
                    )}
                    {product.trending && (
                      <span className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        TRENDING
                      </span>
                    )}
                    {(product.bestSeller || product.isBestSeller) && (
                      <span className="bg-black text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        BEST SELLER
                      </span>
                    )}
                    {showDiscount && (
                      <span className="bg-[#38BDF8] text-black text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {product.stockStatus === "OUT_OF_STOCK" && (
                      <span className="bg-red-600 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        Sold Out
                      </span>
                    )}
                    {product.stockStatus === "LOW_STOCK" && (
                      <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <Link href={`/product/${product.id}`} className="block cursor-pointer hover:text-[#38BDF8] transition-colors">
                      <h4 className="text-base font-bold text-[#111111] line-clamp-1 uppercase">
                        {product.name}
                      </h4>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-sm font-bold text-[#111111]">
                        ₹{product.price}
                      </span>
                      {showDiscount && (
                        <span className="text-xs text-neutral-400 line-through font-semibold">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      href={`/product/${product.id}`}
                      className="block w-full bg-[#38BDF8] text-[#111111] py-3 rounded-xl font-bold text-center hover:bg-[#0ea5e9] hover:text-white transition text-xs tracking-wider uppercase shadow-sm select-none"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
