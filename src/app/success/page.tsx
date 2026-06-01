"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams ? searchParams.get("orderNumber") : null;

  return (
    <div className="text-center bg-zinc-900 p-10 rounded-3xl max-w-md w-full border border-zinc-800">
      <div className="text-green-500 text-6xl mb-4">
        ✓
      </div>

      <h1 className="text-4xl font-bold mb-4">
        Order Successful!
      </h1>

      <p className="text-gray-400 mb-6">
        Thank you for your purchase. Your order has been placed successfully.
      </p>

      {orderNumber && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 mb-8">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
            Your Order Tracking Code
          </p>
          <p className="text-2xl font-mono font-black text-white select-all">
            {orderNumber}
          </p>
          <Link
            href={`/order-tracking?orderNumber=${orderNumber}`}
            className="inline-block mt-4 text-xs text-blue-400 hover:text-blue-300 font-bold transition hover:underline"
          >
            Track Status Now ➔
          </Link>
        </div>
      )}

      <button
        onClick={() => router.push("/")}
        className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 transition"
      >
        Continue Shopping
      </button>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Suspense fallback={
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-zinc-500 text-sm">Preparing invoice receipt...</p>
        </div>
      }>
        <SuccessPageContent />
      </Suspense>
    </main>
  );
}