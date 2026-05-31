"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // optional: auto redirect after 5 sec
    // setTimeout(() => router.push("/"), 5000);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">

      <div className="text-center bg-zinc-900 p-10 rounded-3xl max-w-md w-full">

        <div className="text-green-500 text-6xl mb-4">
          ✓
        </div>

        <h1 className="text-4xl font-bold mb-4">
          Order Successful!
        </h1>

        <p className="text-gray-400 mb-6">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <button
          onClick={() => router.push("/")}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold"
        >
          Continue Shopping
        </button>

      </div>

    </main>
  );
}