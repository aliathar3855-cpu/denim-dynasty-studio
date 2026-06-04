"use client";

import { useEffect, useState } from "react";
import { doc, collection, query, where, getDocs, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useCart } from "@/context/CartContext";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { formatSize, KIDS_SIZE_CHART } from "@/lib/products";
import Image from "next/image";
import HoverMagnifier from "@/components/HoverMagnifier";
import ProductImageLightbox from "@/components/ProductImageLightbox";
import { getOptimizedImageUrl } from "@/lib/cloudinaryHelper";
import { useWishlist } from "@/context/WishlistContext";

interface ProductPageClientProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    imageUrl?: string;
    sizeType: "LETTER" | "NUMERIC";
    sizes: string[];
    stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    originalPrice?: number;
    salePrice?: number;
    isBestSeller?: boolean;
    ageGroups?: string[];
  };
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const { addToCart, showToast } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedSize, setSelectedSize] = useState("");

  // Gallery State
  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl || "/placeholder-product.png"];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Swipe gesture support state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Size Guide Modal State
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Related & Recently Viewed States
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Load Related Products and track Recently Viewed on mount
  useEffect(() => {
    const loadStorefrontData = async () => {
      try {
        // 1. Fetch Related Products (same category, exclude current)
        const productsRef = collection(db, "products");
        const categoryQuery = query(
          productsRef,
          where("category", "==", product.category)
        );
        const catSnapshot = await getDocs(categoryQuery);
        const matches = catSnapshot.docs
          .map((docItem) => ({ id: docItem.id, ...docItem.data() } as any))
          .filter((item) => item.id !== product.id)
          .slice(0, 4);
        setRelatedProducts(matches);

        // 2. Fetch Recently Viewed Products
        const storedHistory = localStorage.getItem("recentlyViewed");
        let historyArray: string[] = storedHistory ? JSON.parse(storedHistory) : [];

        // Fetch documents for previously viewed items (exclude current)
        const viewedDocs: any[] = [];
        const uniqueHistory = historyArray.filter((id) => id !== product.id).slice(0, 4);

        for (const prevId of uniqueHistory) {
          const prevSnap = await getDocs(query(productsRef));
          const matchDoc = prevSnap.docs.find(d => d.id === prevId);
          if (matchDoc) {
            viewedDocs.push({ id: matchDoc.id, ...matchDoc.data() });
          }
        }
        setRecentlyViewed(viewedDocs);

        // Add current product to local storage history
        if (!historyArray.includes(product.id)) {
          historyArray.unshift(product.id);
        } else {
          // Re-insert at start
          historyArray = [product.id, ...historyArray.filter((id) => id !== product.id)];
        }
        localStorage.setItem("recentlyViewed", JSON.stringify(historyArray.slice(0, 10)));
      } catch (err) {
        console.error("Error loading related/recent products:", err);
      }
    };

    loadStorefrontData();
    fetchReviews();
  }, [product.id]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", product.id),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const reviewsList: any[] = [];
      querySnapshot.forEach((docItem) => {
        reviewsList.push({
          id: docItem.id,
          ...docItem.data()
        });
      });
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) {
      toast.error("Please enter both Name and Review text.");
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = {
        productId: product.id,
        customerName: newReviewName,
        rating: Number(newReviewRating),
        reviewText: newReviewText,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      setFormSuccess(true);
      toast.success("Review submitted successfully!");
      setNewReviewName("");
      setNewReviewText("");
      setNewReviewRating(5);
      
      setReviews(prev => [
        { id: docRef.id, ...newReview },
        ...prev
      ]);
      
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding review:", error);
      toast.error("Something went wrong while submitting your review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review calculations
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / totalReviews).toFixed(1)
    : "0.0";

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rate = Math.round(Number(r.rating || 0));
    if (rate >= 1 && rate <= 5) {
      ratingDistribution[rate as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });

  // Calculate Sale discount percentage
  const showDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = showDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    const minDistance = 50; // minimum swipe distance

    if (diff > minDistance) {
      // Swiped Left -> Next Image
      setActiveImageIndex((prev) => (prev + 1) % productImages.length);
    } else if (diff < -minDistance) {
      // Swiped Right -> Previous Image
      setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const selectNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const selectPrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-6xl mx-auto">
      
      {/* Product Details Section */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-14">
        
        {/* Left column: Image Gallery */}
        <div className="space-y-4">
          <div 
            className="relative h-[380px] sm:h-[500px] w-full rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm flex items-center justify-center select-none group"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Gallery Navigation Arrows */}
            {productImages.length > 1 && (
              <>
                <button
                  onClick={selectPrevImage}
                  className="absolute left-4 z-10 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow transition cursor-pointer font-black text-xs md:text-sm"
                  aria-label="Previous image"
                >
                  ❮
                </button>
                <button
                  onClick={selectNextImage}
                  className="absolute right-4 z-10 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow transition cursor-pointer font-black text-xs md:text-sm"
                  aria-label="Next image"
                >
                  ❯
                </button>
              </>
            )}

            <HoverMagnifier
              src={productImages[activeImageIndex]}
              alt={`${product.name} - image ${activeImageIndex + 1}`}
              onClick={() => setIsLightboxOpen(true)}
            />

            {/* Out of Stock banner overlay on main preview */}
            {product.stockStatus === "OUT_OF_STOCK" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-red-600 text-white font-black tracking-widest text-sm px-6 py-2.5 rounded-full uppercase shadow">
                  Out Of Stock
                </span>
              </div>
            )}
            
            {/* Best Seller ribbon banner */}
            {product.isBestSeller && (
              <span className="absolute top-4 left-4 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                Best Seller
              </span>
            )}
          </div>

          {/* Interactive Thumbnails list */}
          {productImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                    idx === activeImageIndex ? "border-[#38BDF8] scale-[1.03] shadow-sm" : "border-neutral-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getOptimizedImageUrl(img, 155)}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Description, Sizes, Buy Actions */}
        <div className="flex flex-col justify-center">
          
          <span className="text-xs font-black uppercase tracking-widest text-[#38BDF8] mb-1">
            Curated Collection / {product.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight uppercase">
            {product.name}
          </h1>

          {/* Reviews Summary Section */}
          <div className="flex items-center gap-2 mt-4 text-xs font-medium">
            {totalReviews > 0 ? (
              <>
                <span className="text-[#38BDF8]">
                  {"★".repeat(Math.round(Number(averageRating)))}
                  <span className="text-neutral-250">{"☆".repeat(5 - Math.round(Number(averageRating)))}</span>
                </span>
                <span className="font-bold text-[#111111]">{averageRating} / 5.0</span>
                <button
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-neutral-500 underline ml-1 cursor-pointer hover:text-black font-semibold"
                >
                  ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </button>
              </>
            ) : (
              <>
                <span className="text-neutral-350">★★★★★</span>
                <span className="text-neutral-500">No reviews yet</span>
                <button
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[#38BDF8] underline ml-1.5 cursor-pointer font-bold"
                >
                  Be the first to review
                </button>
              </>
            )}
          </div>

          {/* Pricing Info & Discount Badges */}
          <div className="flex items-baseline gap-4 mt-6">
            <span className="text-3xl font-black text-[#111111]">
              ₹{product.price}
            </span>
            {showDiscount && (
              <>
                <span className="text-base text-neutral-400 line-through font-bold">
                  ₹{product.originalPrice}
                </span>
                <span className="bg-[#38BDF8] text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {discountPercent}% OFF
                </span>
              </>
            )}

            {/* Inventory Indicator Badges */}
            {product.stockStatus === "LOW_STOCK" && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-250 animate-pulse">
                Low Stock
              </span>
            )}
            {product.stockStatus === "OUT_OF_STOCK" && (
              <span className="ml-2 bg-red-150 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-200">
                Sold Out
              </span>
            )}
          </div>

          <p className="text-neutral-600 mt-6 text-sm sm:text-base leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Suitable For Age Groups */}
          {product.ageGroups && product.ageGroups.length > 0 && (
            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666666] block mb-2">
                Suitable For
              </span>
              <div className="flex flex-wrap gap-2">
                {product.ageGroups.map((age) => (
                  <span
                    key={age}
                    className="inline-flex items-center gap-1 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                  >
                    👶 {age}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Size Selectors Section */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Select Size *
                </label>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs font-bold text-[#38BDF8] hover:text-[#0ea5e9] hover:underline cursor-pointer transition uppercase tracking-wider"
                >
                  📏 Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((size: string) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        console.log(`[Size Selection] Selected size: "${size}" for product: "${product.name}" (${product.id})`);
                      }}
                      className={`px-4.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#38BDF8] text-black border-[#38BDF8]"
                          : "bg-white border-neutral-200 text-[#666666] hover:text-[#38BDF8] hover:border-[#38BDF8]/40"
                      }`}
                    >
                      {formatSize(size)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cart Add & Wishlist Buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => {
                if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                  showToast("Please select a size", "error");
                  return;
                }

                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: productImages[0],
                  imageUrl: productImages[0],
                  quantity: 1,
                  selectedSize: selectedSize || null,
                });
              }}
              disabled={product.stockStatus === "OUT_OF_STOCK"}
              className="flex-1 bg-[#111111] hover:bg-neutral-800 disabled:bg-neutral-250 disabled:text-neutral-450 text-white py-4.5 rounded-xl font-bold transition shadow-md cursor-pointer text-sm uppercase tracking-wider select-none text-center"
            >
              {product.stockStatus === "OUT_OF_STOCK" ? "Out Of Stock" : "Add To Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-4.5 rounded-xl border transition cursor-pointer select-none flex items-center justify-center min-w-[56px] text-xl shadow-sm ${
                isInWishlist(product.id)
                  ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                  : "bg-white border-neutral-200 text-neutral-400 hover:text-red-550 hover:bg-neutral-50"
              }`}
              title={isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {isInWishlist(product.id) ? "❤️" : "🤍"}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 mt-10 pt-8 border-t border-neutral-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">💵</span>
              <span className="text-xs font-bold text-neutral-500 tracking-wide uppercase">Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">✈️</span>
              <span className="text-xs font-bold text-neutral-500 tracking-wide uppercase">Fast Shipping (India)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🛡️</span>
              <span className="text-xs font-bold text-neutral-500 tracking-wide uppercase">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🔄</span>
              <span className="text-xs font-bold text-neutral-500 tracking-wide uppercase">Easy 7-day Returns</span>
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-neutral-200 mt-20 pt-16">
          <h3 className="text-2xl font-black tracking-tight text-[#111111] mb-8 uppercase text-center md:text-left">
            Related Products
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              const hasDiscount = p.originalPrice && p.originalPrice > p.price;
              const discount = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              return (
                <div key={p.id} className="group border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition flex flex-col h-full">
                  <Link href={`/product/${p.id}`} className="block relative aspect-square overflow-hidden shrink-0">
                    <img
                      src={p.imageUrl || p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 bg-[#38BDF8] text-black text-[8px] font-black px-2 py-0.5 rounded shadow">
                        {discount}% OFF
                      </span>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <Link href={`/product/${p.id}`} className="font-bold text-xs sm:text-sm text-[#111111] hover:text-[#38BDF8] line-clamp-1 block transition-colors">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-black">₹{p.price}</span>
                        {hasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{p.originalPrice}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-neutral-200 mt-16 pt-12">
          <h3 className="text-2xl font-black tracking-tight text-[#111111] mb-8 uppercase text-center md:text-left">
            Recently Viewed
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyViewed.map((p) => {
              const hasDiscount = p.originalPrice && p.originalPrice > p.price;
              const discount = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 105) : 0;
              return (
                <div key={p.id} className="group border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition flex flex-col h-full">
                  <Link href={`/product/${p.id}`} className="block relative aspect-square overflow-hidden shrink-0">
                    <img
                      src={p.imageUrl || p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-305"
                    />
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 bg-[#38BDF8] text-black text-[8px] font-black px-2 py-0.5 rounded shadow">
                        {discount}% OFF
                      </span>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <Link href={`/product/${p.id}`} className="font-bold text-xs sm:text-sm text-[#111111] hover:text-[#38BDF8] line-clamp-1 block transition-colors">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-black">₹{p.price}</span>
                        {hasDiscount && <span className="text-[10px] text-neutral-400 line-through">₹{p.originalPrice}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews Dashboard section */}
      <section id="reviews-section" className="max-w-5xl mx-auto border-t border-neutral-200 mt-20 pt-16 pb-12">
        <h3 className="text-2xl font-bold tracking-tight text-[#111111] mb-8">
          Customer Reviews
        </h3>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Summary Dashboard */}
          <div className="space-y-6">
            <div>
              <div className="text-5xl font-black text-[#111111]">
                {averageRating}
              </div>
              <p className="text-sm font-semibold text-[#666666] mt-1">
                out of 5.0 stars
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xl text-[#38BDF8]">
                {"★".repeat(Math.round(Number(averageRating)))}
                <span className="text-neutral-250">{"☆".repeat(5 - Math.round(Number(averageRating)))}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs text-[#666666]">
                    <span className="w-12 whitespace-nowrap font-medium">{stars} star</span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#38BDF8] rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right font-semibold text-[#111111]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-[#111111] border-b border-neutral-100 pb-3">
                Reviews ({totalReviews})
              </h4>
              
              {loadingReviews ? (
                <div className="flex items-center justify-center py-10">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-8 text-center bg-[#f8f8f8] border border-neutral-100 rounded-2xl text-[#666666] text-sm">
                  There are no reviews yet for this product. Be the first to share your thoughts!
                </div>
              ) : (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                  {reviews.map((review) => {
                    const dateStr = review.createdAt?.seconds 
                      ? new Date(review.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })
                      : new Date().toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        });
                    return (
                      <div key={review.id} className="border-b border-neutral-100 pb-5 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-bold text-[#111111] text-sm block">
                              {review.customerName}
                            </span>
                            <div className="flex items-center gap-1 mt-1 text-xs text-[#38BDF8]">
                              {"★".repeat(Number(review.rating))}
                              <span className="text-neutral-300">{"☆".repeat(5 - Number(review.rating))}</span>
                            </div>
                          </div>
                          <span className="text-xs text-neutral-400 font-medium">
                            {dateStr}
                          </span>
                        </div>
                        <p className="text-sm text-[#666666] mt-3 leading-relaxed">
                          {review.reviewText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Write Review Form */}
            <div className="bg-[#f8f8f8] border border-neutral-200 p-6 rounded-2xl">
              <h4 className="text-lg font-bold text-[#111111] mb-4">
                Write a Review
              </h4>
              
              {formSuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <span>✓</span> Thank you! Your review has been submitted successfully.
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      placeholder="e.g. John Doe"
                      value={newReviewName}
                      onChange={(e) => setNewReviewName(e.target.value)}
                      className="w-full p-3.5 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-sm text-[#111111] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-1">
                      Rating
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className="text-2xl cursor-pointer focus:outline-none transition-transform hover:scale-110"
                        >
                          {star <= newReviewRating ? (
                            <span className="text-[#38BDF8]">★</span>
                          ) : (
                            <span className="text-neutral-300">★</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-1.5">
                      Review
                    </label>
                    <textarea
                      placeholder="Write your review here..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="w-full p-3.5 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-sm text-[#111111] transition h-28 resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-[#38BDF8] text-black py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition text-sm cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Size Guide Overlay Modal Dialog */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl max-w-md w-full border border-neutral-200 p-6 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowSizeGuide(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-black font-extrabold text-xl p-1 Cursor-pointer transition select-none"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h3 className="text-xl font-black tracking-tight uppercase text-black mb-1">
              📏 Kids Sizing Chart
            </h3>
            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-6">
              Age mapping recommendations
            </p>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead className="bg-[#f8f8f8] text-[#111111] uppercase font-black tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="px-5 py-3">Numeric Size</th>
                    <th className="px-5 py-3">Recommended Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {Object.entries(KIDS_SIZE_CHART).sort((a, b) => Number(a[0]) - Number(b[0])).map(([sz, age]) => (
                    <tr key={sz} className="hover:bg-neutral-50/50">
                      <td className="px-5 py-3.5 font-bold text-black">{sz}</td>
                      <td className="px-5 py-3.5">{age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full mt-6 bg-[#111111] text-white py-3.5 rounded-xl font-bold hover:bg-[#38BDF8] hover:text-black transition text-center text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}

      {/* Product Image Zoom Fullscreen Lightbox Modal */}
      <ProductImageLightbox
        images={productImages}
        initialIndex={activeImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        productName={product.name}
      />

    </main>
  );
}
