"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import { formatSize } from "@/lib/products";

const AVAILABLE_CATEGORIES = [
  "All",
  "Cord Set",
  "Shirt",
  "T-Shirt",
  "Pant",
  "Track Pant",
  "3/4 Pant",
];

const AVAILABLE_AGES = [
  "All",
  "1-2 Years",
  "2-4 Years",
  "4-6 Years",
  "6-8 Years",
  "8-10 Years",
  "10-12 Years",
  "12-14 Years",
];

const CATEGORY_MAP: Record<string, string> = {
  "t-shirt": "T-Shirt",
  "t-shirts": "T-Shirt",
  "shirt": "Shirt",
  "shirts": "Shirt",
  "pant": "Pant",
  "pants": "Pant",
  "track pant": "Track Pant",
  "track-pant": "Track Pant",
  "3/4 pant": "3/4 Pant",
  "3-4-pant": "3/4 Pant",
  "3/4-pant": "3/4 Pant",
  "cord set": "Cord Set",
  "cord-set": "Cord Set",
  "jeans": "Pant",
  "jackets": "Cord Set",
};

function ProductsFilterContent() {
  const { category } = useParams();
  const searchParams = useSearchParams();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAge, setSelectedAge] = useState("All");
  const [maxPrice, setMaxPrice] = useState(2500);

  const categoryStr = Array.isArray(category) ? category.join("/") : category || "";
  const cleanCat = decodeURIComponent(categoryStr).toLowerCase().trim();

  // Load products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "products")));
        let data = snapshot.docs.map((doc) => {
          const item = doc.data();
          const images = Array.isArray(item.images) ? item.images : (item.imageUrl ? [item.imageUrl] : []);
          return {
            id: doc.id,
            ...item,
            imageUrl: item.imageUrl || images[0] || "/placeholder-product.png",
            images,
            price: Number(item.price) || 0,
            originalPrice: item.originalPrice !== undefined && item.originalPrice !== null ? Number(item.originalPrice) : undefined,
            featured: !!item.featured,
            trending: !!item.trending,
            bestSeller: item.bestSeller !== undefined ? !!item.bestSeller : !!item.isBestSeller,
            isBestSeller: item.bestSeller !== undefined ? !!item.bestSeller : !!item.isBestSeller,
            season: item.season || "All Season",
            ageGroups: Array.isArray(item.ageGroups) ? item.ageGroups : [],
          };
        });

        // If sorting new arrivals
        if (cleanCat === "new-arrivals" || cleanCat === "new arrivals") {
          data = data.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
            return dateB - dateA;
          });
        }

        setProducts(data);

        // Calculate max price from data to dynamically set slider max
        if (data.length > 0) {
          const highestPrice = Math.max(...data.map((p) => p.price));
          setMaxPrice(highestPrice > 0 ? highestPrice : 2500);
        }
      } catch (error) {
        console.error("Failed to load products list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cleanCat]);

  // Bind category from URL route
  useEffect(() => {
    if (cleanCat && cleanCat !== "all" && cleanCat !== "new-arrivals" && cleanCat !== "new arrivals") {
      const mapped = CATEGORY_MAP[cleanCat] || cleanCat;
      // Match exact label case
      const matchedLabel = AVAILABLE_CATEGORIES.find(c => c.toLowerCase() === mapped.toLowerCase());
      setSelectedCategory(matchedLabel || "All");
    } else {
      setSelectedCategory("All");
    }
  }, [cleanCat]);

  // Bind age group from URL query parameters
  useEffect(() => {
    const ageParam = searchParams ? searchParams.get("ageGroup") : null;
    if (ageParam) {
      setSelectedAge(ageParam);
    }
  }, [searchParams]);

  // Client-side filtering logic
  const filteredProducts = products.filter((product) => {
    // 1. Category Filter
    if (selectedCategory !== "All") {
      const prodCat = (product.category || "").toLowerCase().trim();
      const targetCat = selectedCategory.toLowerCase().trim();
      if (prodCat !== targetCat) return false;
    }

    // 2. Age Group Filter
    if (selectedAge !== "All") {
      const prodAges = product.ageGroups || [];
      if (!prodAges.includes(selectedAge)) return false;
    }

    // 3. Price Filter
    if (product.price > maxPrice) return false;

    return true;
  });

  const newestIds = products
    .slice()
    .sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 4)
    .map((p) => p.id);

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading products catalog...</h1>
        </div>
      </main>
    );
  }

  // Display Title
  let displayTitle = "All Products";
  if (cleanCat && cleanCat !== "all") {
    displayTitle = cleanCat.replace("-", " ");
  }

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-7xl mx-auto">
      {/* Title */}
      <h1 className="text-4xl font-black mb-10 capitalize tracking-tight text-[#111111] border-b border-neutral-100 pb-5">
        {displayTitle} Collection
      </h1>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Filter Sidebar */}
        <aside className="w-full lg:w-1/4 space-y-8 bg-[#f8f8f8] border border-neutral-200 p-6 md:p-8 rounded-3xl h-fit">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <h3 className="text-lg font-bold text-black uppercase tracking-tight">Filters</h3>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedAge("All");
                if (products.length > 0) {
                  setMaxPrice(Math.max(...products.map(p => p.price)));
                }
              }}
              className="text-xs font-bold text-[#38BDF8] hover:text-[#0ea5e9] transition uppercase tracking-wider cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">Category</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer select-none text-left w-fit lg:w-full ${
                      isActive
                        ? "bg-[#38BDF8] text-black border-[#38BDF8]"
                        : "bg-white border-neutral-200 text-[#666666] hover:text-black hover:border-neutral-400"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Group Filter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">Age Group</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {AVAILABLE_AGES.map((age) => {
                const isActive = selectedAge === age;
                return (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer select-none text-left w-fit lg:w-full ${
                      isActive
                        ? "bg-[#38BDF8] text-black border-[#38BDF8]"
                        : "bg-white border-neutral-200 text-[#666666] hover:text-black hover:border-neutral-400"
                    }`}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">Max Price</h4>
              <span className="text-sm font-black text-black">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min={0}
              max={products.length > 0 ? Math.max(...products.map(p => p.price)) : 3000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
              <span>₹0</span>
              <span>₹{products.length > 0 ? Math.max(...products.map(p => p.price)) : 3000}</span>
            </div>
          </div>
        </aside>

        {/* Right Column: Products Grid */}
        <section className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
              <span className="text-4xl block mb-4">🔍</span>
              <h2 className="text-xl font-bold text-[#666666] mb-2">
                No Products Found
              </h2>
              <p className="text-neutral-400 text-xs font-semibold">
                Try resetting or adjusting your search filters to find suitable items.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">
                Showing {filteredProducts.length} product(s)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const showDiscount = product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = showDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full group relative"
                    >
                      {/* Wishlist Heart Toggle */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="absolute top-3 right-3 z-20 bg-white/90 hover:bg-white text-neutral-800 p-2 rounded-full shadow-sm hover:shadow transition cursor-pointer select-none active:scale-95"
                        title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                      >
                        <span className="text-sm block leading-none">{isInWishlist(product.id) ? "❤️" : "🤍"}</span>
                      </button>

                      <Link href={`/product/${product.id}`} className="block cursor-pointer overflow-hidden relative aspect-square">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      </Link>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                        {newestIds.includes(product.id) && (
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
                          <span className="bg-red-600 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow shadow-sm">
                            Sold Out
                          </span>
                        )}
                        {product.stockStatus === "LOW_STOCK" && (
                          <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow shadow-sm">
                            Low Stock
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div>
                          <Link href={`/product/${product.id}`} className="block cursor-pointer hover:text-[#38BDF8] transition-colors">
                            <h2 className="text-base font-bold text-[#111111] line-clamp-1 uppercase">
                              {product.name}
                            </h2>
                          </Link>
                          
                          {/* Age groups indicator badge */}
                          {product.ageGroups && product.ageGroups.length > 0 && (
                            <p className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider mt-1.5 line-clamp-1">
                              Age: {product.ageGroups.join(", ")}
                            </p>
                          )}

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

                        <Link
                          href={`/product/${product.id}`}
                          className="mt-5 block w-full bg-[#38BDF8] text-black py-3 rounded-xl font-bold text-center hover:bg-[#0ea5e9] hover:text-white transition text-xs tracking-wider uppercase cursor-pointer shadow-sm select-none"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
        
      </div>
    </main>
  );
}

export default function CategoryProducts() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <h1 className="text-xl font-bold">Loading...</h1>
        </div>
      </main>
    }>
      <ProductsFilterContent />
    </Suspense>
  );
}
