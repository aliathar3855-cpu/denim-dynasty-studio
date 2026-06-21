"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime error caught by my-orders boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-xl mx-auto flex flex-col justify-center items-center">
      <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-center space-y-6 w-full shadow-sm">
        <h1 className="text-2xl font-bold text-red-700">Orders View Error</h1>
        <p className="text-sm text-[#666666] leading-relaxed">
          An error occurred while loading your order dashboard or details.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#38BDF8] text-black py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition text-center flex items-center justify-center text-sm cursor-pointer shadow-sm"
          >
            Retry
          </button>
          <Link
            href="/my-orders"
            className="block w-full text-center border border-neutral-250 bg-white text-neutral-700 py-3.5 rounded-xl font-bold hover:bg-neutral-50 hover:text-black transition text-sm shadow-sm"
          >
            Back to My Orders
          </Link>
        </div>
      </div>
    </main>
  );
}
