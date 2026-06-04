"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatSize } from "@/lib/products";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    showToast,
  } = useCart();

  const router = useRouter();

  const subtotal = cart.reduce(
    (total: number, item: any) =>
      total + item.price * item.quantity,
    0
  );
  const FREE_SHIPPING_THRESHOLD = 999;
  const DELIVERY_FEE = 99;
  const deliveryCharge = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = subtotal + deliveryCharge;

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-4xl mx-auto">
      


      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111]">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
          <h2 className="text-2xl font-bold text-[#666666] mb-6">
            Your cart is empty
          </h2>
          <Link href="/" className="bg-[#38BDF8] text-black px-8 py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-md">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {cart.map((item: any) => (
            <div
              key={`${item.id}-${item.selectedSize}`}
              className="bg-white border border-neutral-200 shadow-sm rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full md:w-[200px] h-[200px] object-cover rounded-2xl border border-neutral-200"
              />

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-[#111111] tracking-tight">
                  {item.name}
                </h2>

                {item.selectedSize && (
                  <p className="text-xs text-[#666666] mt-1 font-semibold">
                    Size: <span className="text-[#111111] font-bold">{formatSize(item.selectedSize)}</span>
                  </p>
                )}

                <p className="text-[#666666] mt-2 text-lg font-semibold">
                  ₹{item.price}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                  <button
                    onClick={() => decreaseQuantity(item.id, item.selectedSize)}
                    className="bg-[#111111] text-white w-10 h-10 rounded-full text-xl font-bold hover:bg-[#38BDF8] hover:text-black transition flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>

                  <span className="text-xl font-bold w-8 text-center text-[#111111]">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item.id, item.selectedSize)}
                    className="bg-[#111111] text-white w-10 h-10 rounded-full text-xl font-bold hover:bg-[#38BDF8] hover:text-black transition flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-4 min-w-[120px]">
                <p className="text-2xl font-black text-[#111111]">
                  ₹{item.price * item.quantity}
                </p>

                <button
                  onClick={() => removeFromCart(item.id, item.selectedSize)}
                  className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold transition text-sm cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Dynamic Free Shipping Progress Alert */}
          <div className={`p-4 rounded-2xl border text-sm font-bold tracking-tight mb-2 flex items-center justify-between transition-all ${
            subtotal >= FREE_SHIPPING_THRESHOLD
              ? "bg-[#38BDF8]/10 border-[#38BDF8] text-black"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}>
            <span>
              {subtotal >= FREE_SHIPPING_THRESHOLD
                ? "🎉 Congratulations! You unlocked FREE Delivery"
                : `Add ₹${FREE_SHIPPING_THRESHOLD - subtotal} more to unlock FREE Delivery 🚚`}
            </span>
            {subtotal < FREE_SHIPPING_THRESHOLD ? (
              <span className="text-[10px] uppercase font-black tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md hidden sm:inline-block">
                Progress
              </span>
            ) : (
              <span className="text-[10px] uppercase font-black tracking-wider bg-[#38BDF8] text-black px-2 py-0.5 rounded-md hidden sm:inline-block">
                Unlocked
              </span>
            )}
          </div>

          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-8 space-y-4">
            {/* Totals Breakdown */}
            <div className="space-y-2 pb-4 border-b border-neutral-200">
              <div className="flex justify-between text-neutral-600 font-semibold text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-semibold text-sm">
                <span>Delivery Charge</span>
                <span>{deliveryCharge === 0 ? <span className="text-[#38BDF8] font-black">FREE</span> : `₹${deliveryCharge}`}</span>
              </div>
            </div>

            <h2 className="text-3xl font-black text-[#111111] flex justify-between">
              <span>Grand Total:</span>
              <span>₹{grandTotal}</span>
            </h2>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => router.push("/checkout")}
                className="bg-[#38BDF8] text-black px-8 py-4 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition cursor-pointer shadow-md select-none"
              >
                Proceed To Checkout
              </button>
              <button
                onClick={() => {
                  clearCart();
                  showToast("Cart cleared", "success");
                }}
                className="bg-white border border-neutral-300 text-neutral-600 px-8 py-4 rounded-xl font-bold hover:bg-neutral-100 hover:text-black transition cursor-pointer select-none animate-fadeIn"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}