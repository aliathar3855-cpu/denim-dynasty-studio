"use client";

import { useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";
import Image from "next/image";

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrders([]);
    setSearched(false);

    const inputPhone = phone.trim();
    if (!inputPhone) {
      setError("Please enter your phone number.");
      return;
    }

    const cleanInputPhone = inputPhone.replace(/[^0-9]/g, "");
    if (cleanInputPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const suffixInput = cleanInputPhone.slice(-10);

    try {
      setLoading(true);

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const allOrders: any[] = [];
      snapshot.forEach((docItem) => {
        allOrders.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });

      // Filter by normalized suffix matching
      const matchedOrders = allOrders.filter((order) => {
        const customerPhone = order.customer?.phone || "";
        const cleanDbPhone = customerPhone.replace(/[^0-9]/g, "");
        const suffixDb = cleanDbPhone.slice(-10);
        return suffixInput === suffixDb;
      });

      setOrders(matchedOrders);
      setSearched(true);
    } catch (err) {
      console.error("Error retrieving orders:", err);
      setError("An error occurred while fetching your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    let date: Date;
    if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt.toDate) {
      date = createdAt.toDate();
    } else {
      date = new Date(createdAt);
    }
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string) => {
    const s = (status || "pending").toLowerCase();
    if (s === "delivered") return { text: "Delivered", class: "bg-green-50 text-green-700 border-green-200" };
    if (s === "shipped") return { text: "Shipped", class: "bg-blue-50 text-blue-700 border-blue-200" };
    if (s === "processing") return { text: "Processing", class: "bg-purple-50 text-purple-700 border-purple-200" };
    return { text: "Order Placed", class: "bg-amber-50 text-amber-700 border-amber-200" };
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-12 border-b border-neutral-200 pb-5">
        <Link href="/" className="flex items-center shrink-0">
          {/* Full Logo - Desktop and Tablet */}
          <div className="hidden sm:block">
            <Image
              src="/logo-full.png"
              alt="Denim Dynasty Studio"
              width={200}
              height={50}
              priority
              className="w-auto h-9 md:h-11 object-contain"
            />
          </div>
          {/* Icon Logo - Mobile */}
          <div className="block sm:hidden">
            <Image
              src="/logo-icon.png"
              alt="Denim Dynasty Studio"
              width={50}
              height={50}
              priority
              className="w-10 h-10 object-contain"
            />
          </div>
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      <div className="max-w-xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-black mb-3 tracking-tight text-[#111111]">
          My Orders
        </h1>
        <p className="text-[#666666] text-sm">
          Enter your registered phone number to view your order history and live transit status.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="max-w-md mx-auto mb-16">
        <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">
                Customer Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 7003951437"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-4 text-sm rounded-xl bg-white border border-neutral-300 outline-none focus:border-neutral-500 text-[#111111] transition"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs text-center border border-red-250 bg-red-50 py-2.5 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-bold hover:bg-neutral-800 transition text-center flex items-center justify-center disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching Orders...
                </>
              ) : (
                "Search Orders"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Orders List Result */}
      {searched && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
          <h2 className="text-2xl font-bold text-[#111111] mb-6">
            Purchase History ({orders.length} {orders.length === 1 ? "order" : "orders"})
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-[#f8f8f8] border border-neutral-200 rounded-3xl">
              <p className="text-[#666666] font-medium text-sm">
                No orders found under this phone number.
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Please double check the spelling or contact support if you believe this is an error.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop view (Table) */}
              <div className="hidden md:block bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f8f8f8] text-xs text-[#666666] uppercase border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {orders.map((order) => {
                      const statusInfo = getStatusLabel(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-neutral-50/50 transition">
                          <td className="px-6 py-4 font-mono font-bold text-xs text-[#111111]">
                            {order.orderNumber || order.id}
                          </td>
                          <td className="px-6 py-4 text-[#666666]">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#111111]">
                            ₹{order.total || 0}
                          </td>
                          <td className="px-6 py-4 capitalize text-[#666666]">
                            {order.paymentMethod === "cod" ? "COD" : "Online"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/my-orders/${order.id}`}
                              className="inline-block bg-[#111111] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile view (Stackable Cards) */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => {
                  const statusInfo = getStatusLabel(order.status);
                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                        <span className="font-mono font-bold text-sm text-[#111111]">
                          {order.orderNumber || order.id}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-[#666666]">
                        <div>
                          <span className="block text-[10px] text-neutral-400">Order Date</span>
                          <span className="font-medium text-[#111111]">{formatDate(order.createdAt)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-neutral-400">Grand Total</span>
                          <span className="font-bold text-[#111111]">₹{order.total || 0}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-neutral-400">Payment</span>
                          <span className="font-medium text-[#111111] capitalize">
                            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Checkout"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/my-orders/${order.id}`}
                          className="block text-center bg-[#111111] text-white py-3 rounded-xl text-xs font-bold hover:bg-neutral-800 transition shadow-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </main>
  );
}
