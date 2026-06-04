"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/admin/products/edit/${id}`);
    } else {
      router.replace("/admin/products");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
        <p className="text-[#666666] text-sm font-medium">Redirecting to product editor...</p>
      </div>
    </div>
  );
}
