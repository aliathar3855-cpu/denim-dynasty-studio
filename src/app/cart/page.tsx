"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const router = useRouter();

  const totalPrice = cart.reduce(
    (total: number, item: any) =>
      total + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-4xl mx-auto">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-10 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111]">
        Shopping Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
          <h2 className="text-2xl font-bold text-[#666666] mb-6">
            Your cart is empty
          </h2>
          <Link href="/" className="bg-[#111111] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-neutral-800 transition">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8">
          {cart.map((item: any) => (
            <div
              key={`${item.id}-${item.selectedSize || ""}`}
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
                    Size: <span className="text-[#111111] font-bold">{item.selectedSize}</span>
                  </p>
                )}

                <p className="text-[#666666] mt-2 text-lg font-semibold">
                  ₹{item.price}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4 mt-6">
                  <button
                    onClick={() => decreaseQuantity(item.id, item.selectedSize)}
                    className="bg-[#111111] text-white w-10 h-10 rounded-full text-xl font-bold hover:bg-neutral-800 transition flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>

                  <span className="text-xl font-bold w-8 text-center text-[#111111]">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item.id, item.selectedSize)}
                    className="bg-[#111111] text-white w-10 h-10 rounded-full text-xl font-bold hover:bg-neutral-800 transition flex items-center justify-center cursor-pointer"
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

          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-8 mt-6">
            <h2 className="text-3xl font-black text-[#111111]">
              Grand Total: ₹{totalPrice}
            </h2>

            <button
              onClick={() => router.push("/checkout")}
              className="mt-6 bg-[#111111] text-white px-8 py-4 rounded-xl font-bold hover:bg-neutral-800 transition cursor-pointer"
            >
              Proceed To Checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
}