"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams ? searchParams.get("orderNumber") : null;

  return (
    <div className="text-center bg-[#f8f8f8] border border-neutral-200 p-10 rounded-3xl max-w-md w-full shadow-sm">
      <div className="text-green-600 text-6xl mb-4 font-bold">
        ✓
      </div>

      <h1 className="text-3xl md:text-4xl font-black mb-4 text-[#111111] tracking-tight">
        Order Successful!
      </h1>

      <p className="text-[#666666] text-sm mb-6 leading-relaxed">
        Thank you for your purchase. Your order has been placed successfully.
      </p>

      {orderNumber && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 mb-8">
          <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-2">
            Your Order Tracking Code
          </p>
          <p className="text-2xl font-mono font-black text-[#111111] select-all">
            {orderNumber}
          </p>
          <Link
            href={`/order-tracking?orderNumber=${orderNumber}`}
            className="inline-block mt-4 text-xs text-neutral-600 hover:text-black font-bold transition hover:underline"
          >
            Track Status Now ➔
          </Link>
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-bold hover:bg-neutral-800 transition cursor-pointer"
      >
        Continue Shopping
      </button>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
      <Suspense fallback={
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-neutral-500 text-sm">Preparing invoice receipt...</p>
        </div>
      }>
        <SuccessPageContent />
      </Suspense>
    </main>
  );
}