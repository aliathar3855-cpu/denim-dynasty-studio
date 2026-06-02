"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import AdminGuard from "@/components/AdminGuard";
import { toast } from "react-hot-toast";
import { brandConfig } from "@/config/brand";

export default function AdminPage() {
  const router = useRouter();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const prodSnapshot = await getDocs(collection(db, "products"));
        setProductCount(prodSnapshot.size);

        try {
          const orderSnapshot = await getDocs(collection(db, "orders"));
          setOrderCount(orderSnapshot.size);
        } catch {
          setOrderCount(0); // fallback if orders collection doesn't exist yet
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("admin");
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (err) {
      console.error(err);
      toast.error("Logout failed");
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111] uppercase">
              Control Panel
            </h1>
            <p className="text-[#666666] text-sm mt-1 font-semibold">{brandConfig.brandName} Admin Panel</p>
          </div>
          <button
            onClick={handleLogout}
            className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-bold transition text-sm cursor-pointer shadow-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Products Count */}
          <div className="bg-[#f8f8f8] border border-neutral-200 p-8 rounded-3xl flex flex-col justify-between h-[180px] shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Total Products</p>
              <h2 className="text-5xl font-black text-black">
                {productCount !== null ? productCount : "—"}
              </h2>
            </div>
            <Link
              href="/admin/products"
              className="text-sm font-bold text-[#38BDF8] hover:text-[#0ea5e9] transition flex items-center gap-1 mt-4"
            >
              Manage Inventory ➔
            </Link>
          </div>

          {/* Orders Count */}
          <div className="bg-[#f8f8f8] border border-neutral-200 p-8 rounded-3xl flex flex-col justify-between h-[180px] shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-1">Total Orders</p>
              <h2 className="text-5xl font-black text-black">
                {orderCount !== null ? orderCount : "—"}
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-bold text-[#38BDF8] hover:text-[#0ea5e9] transition flex items-center gap-1 mt-4"
            >
              View Sales & Shipments ➔
            </Link>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-[#f8f8f8] border border-neutral-200 p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-black tracking-tight uppercase">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/admin/products/new"
              className="flex-1 bg-[#38BDF8] text-black font-bold text-center py-4 rounded-xl hover:bg-[#0ea5e9] hover:text-white transition shadow-sm text-sm"
            >
              Add New Product
            </Link>
            <Link
              href="/admin/products"
              className="flex-1 bg-[#111111] text-white font-bold text-center py-4 rounded-xl hover:bg-neutral-800 transition text-sm"
            >
              View Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex-1 bg-white border border-neutral-300 text-black font-bold text-center py-4 rounded-xl hover:bg-neutral-50 transition text-sm"
            >
              Manage Orders
            </Link>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}