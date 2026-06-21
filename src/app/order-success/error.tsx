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
    console.error("Runtime error caught by boundary:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 text-[#111111] flex items-center justify-center p-6 font-sans">
      <div className="text-center bg-white border border-neutral-200 p-10 rounded-3xl max-w-md w-full shadow-lg">
        <div className="text-red-500 text-6xl mb-4 font-bold">⚠️</div>
        <h1 className="text-2xl font-black mb-4 text-[#111111] tracking-tight">Application Error</h1>
        <p className="text-[#666666] text-sm mb-6 leading-relaxed">
          Something went wrong while displaying your order success details.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-[#38BDF8] text-black py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition cursor-pointer text-sm shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block w-full text-center border border-neutral-200 text-neutral-750 py-3.5 rounded-xl font-bold hover:bg-neutral-50 hover:text-black transition text-sm shadow-sm"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
