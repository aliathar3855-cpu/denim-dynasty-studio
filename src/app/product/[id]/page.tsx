"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { addToCart, cart } = useCart();

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Form states
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

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

  const fetchReviews = async () => {
    try {
      if (!id) return;
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", id.toString()),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const reviewsList: any[] = [];
      querySnapshot.forEach((doc) => {
        reviewsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setReviews(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) {
      alert("Please enter both Name and Review text.");
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = {
        productId: id ? id.toString() : "",
        customerName: newReviewName,
        rating: Number(newReviewRating),
        reviewText: newReviewText,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, "reviews"), newReview);
      setFormSuccess(true);
      setNewReviewName("");
      setNewReviewText("");
      setNewReviewRating(5);
      
      // Update local state immediately
      setReviews(prev => [
        { id: docRef.id, ...newReview },
        ...prev
      ]);
      
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Something went wrong while submitting your review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review calculations
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / totalReviews).toFixed(1)
    : "0.0";

  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };
  reviews.forEach((r) => {
    const rate = Math.round(Number(r.rating || 0));
    if (rate >= 1 && rate <= 5) {
      ratingDistribution[rate as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });

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
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between max-w-5xl mx-auto mb-10 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
            ➔ Back to Shop
          </Link>
          <Link
            href="/cart"
            className="bg-[#111111] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-neutral-800 transition whitespace-nowrap flex items-center gap-2 text-sm"
          >
            <span>Cart</span>
            <span className="bg-white text-[#111111] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {cart.reduce((sum: number, item: any) => sum + item.quantity, 0)}
            </span>
          </Link>
        </div>
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

          {/* Average Rating Stars (Top Summary) */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            {totalReviews > 0 ? (
              <>
                <span className="text-[#111111] font-bold">
                  {"★".repeat(Math.round(Number(averageRating)))}
                  {"☆".repeat(5 - Math.round(Number(averageRating)))}
                </span>
                <span className="font-semibold text-[#111111]">{averageRating} / 5.0</span>
                <button
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[#666666] underline ml-2 cursor-pointer hover:text-black font-medium"
                >
                  ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </button>
              </>
            ) : (
              <>
                <span className="text-neutral-300">★★★★★</span>
                <span className="text-[#666666]">No reviews yet</span>
                <button
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[#111111] underline ml-2 cursor-pointer font-medium hover:text-neutral-600"
                >
                  Be the first to review
                </button>
              </>
            )}
          </div>

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
            }}
            className="mt-8 bg-[#111111] text-white py-4 px-8 rounded-xl font-bold hover:bg-neutral-800 transition shadow-md cursor-pointer"
          >
            Add To Cart
          </button>
        </div>
      </div>

      {/* Reviews Section */}
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
              <div className="flex items-center gap-1.5 mt-2 text-xl text-[#111111]">
                {"★".repeat(Math.round(Number(averageRating)))}
                {"☆".repeat(5 - Math.round(Number(averageRating)))}
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
                        className="h-full bg-[#111111] rounded-full transition-all duration-500" 
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
                            <div className="flex items-center gap-1 mt-1 text-xs text-[#111111]">
                              {"★".repeat(Number(review.rating))}
                              {"☆".repeat(5 - Number(review.rating))}
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
                            <span className="text-[#111111]">★</span>
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
                    className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-bold hover:bg-neutral-800 transition text-sm cursor-pointer disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
