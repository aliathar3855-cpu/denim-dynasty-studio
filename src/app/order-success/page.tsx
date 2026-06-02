"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";
import { brandConfig } from "@/config/brand";
import { formatSize } from "@/lib/products";

function OrderSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams ? searchParams.get("orderNumber") : null;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // 1. Try directly by doc ID
        const docRef = doc(db, "orders", orderNumber);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...snapshot.data() });
        } else {
          // 2. Query fallback (by orderNumber field)
          const q = query(
            collection(db, "orders"),
            where("orderNumber", "==", orderNumber)
          );
          const qSnapshot = await getDocs(q);
          if (!qSnapshot.empty) {
            setOrder({ id: qSnapshot.docs[0].id, ...qSnapshot.docs[0].data() });
          } else {
            setError("Could not locate receipt details.");
          }
        }
      } catch (err) {
        console.error("Error retrieving order for success summary:", err);
        setError("Failed to fetch order summary details.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#38BDF8] mb-4"></div>
        <p className="text-neutral-500 text-sm">Preparing your receipt confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center bg-[#f8f8f8] border border-neutral-200 p-10 rounded-3xl max-w-md w-full shadow-sm">
        <div className="text-red-500 text-6xl mb-4 font-bold">✕</div>
        <h1 className="text-2xl font-black mb-4 text-[#111111] tracking-tight">Order Query Failed</h1>
        <p className="text-[#666666] text-sm mb-6 leading-relaxed">
          {error || "No order number provided in the checkout redirection."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-[#38BDF8] text-black py-3.5 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition cursor-pointer text-sm"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // Retrieve details supporting both schemas
  const userDetails = order.userDetails || {};
  const items = order.items || order.products || [];
  const totalAmount = order.totalAmount !== undefined ? order.totalAmount : (order.total || 0);
  const paymentMethodName = order.paymentMethod || "COD";
  const paymentStatusName = order.paymentStatus || (order.paymentId ? "Paid" : "Pending");
  const shippingAddress = userDetails.address1 
    ? `${userDetails.address1}${userDetails.address2 ? ", " + userDetails.address2 : ""}${userDetails.landmark ? " (Landmark: " + userDetails.landmark + ")" : ""}`
    : (order.customer?.address || "");

  const shippingCity = userDetails.city || order.customer?.city || "";
  const shippingState = userDetails.state || order.customer?.state || "";
  const shippingPincode = userDetails.pincode || order.customer?.pincode || "";

  return (
    <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-3xl shadow-lg p-6 md:p-10 font-sans my-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center bg-sky-50 text-[#38BDF8] w-16 h-16 rounded-full text-4xl mb-4 font-bold border border-sky-100 shadow-inner">
          ✓
        </div>
        <h1 className="text-3xl font-black text-[#111111] tracking-tight">Order Confirmed!</h1>
        <p className="text-neutral-500 text-sm mt-2 max-w-md mx-auto">
          Thank you for shopping at {brandConfig.brandName}. Your streetwear items have been ordered successfully.
        </p>
      </div>

      {/* Invoice Banner */}
      <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Order Reference ID</span>
          <span className="text-xl font-mono font-black text-black select-all">{order.orderId || order.orderNumber}</span>
        </div>
        <div className="text-left sm:text-right">
          <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Payment Method</span>
          <span className="text-sm font-extrabold text-neutral-850 uppercase tracking-wide">
            {paymentMethodName} ({paymentStatusName})
          </span>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Shipping address & customer */}
        <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-5 md:p-6 space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 pb-2">
            Delivery Information
          </h3>
          <div className="text-xs space-y-2 leading-relaxed">
            <div>
              <span className="text-neutral-400 font-semibold block">Customer Name</span>
              <span className="font-bold text-[#111111]">
                {userDetails.firstName ? `${userDetails.firstName} ${userDetails.lastName}` : (order.customer?.name || "N/A")}
              </span>
            </div>
            <div>
              <span className="text-neutral-400 font-semibold block">Phone Number</span>
              <span className="font-bold text-[#111111]">{userDetails.phone || order.customer?.phone || "N/A"}</span>
            </div>
            <div>
              <span className="text-neutral-400 font-semibold block">Shipping Address</span>
              <span className="font-semibold text-neutral-700 block">
                {shippingAddress}, {shippingCity}, {shippingState} - {shippingPincode}
              </span>
            </div>
            {(userDetails.notes || order.customer?.notes) && (
              <div>
                <span className="text-neutral-400 font-semibold block">Notes</span>
                <span className="italic text-neutral-600 font-medium block">
                  "{userDetails.notes || order.customer?.notes}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial info & details */}
        <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-5 md:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 pb-2">
              Purchase Summary
            </h3>
            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
              {items.map((item: any, idx: number) => {
                const name = item.name || "Unknown Item";
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-neutral-650 truncate max-w-[200px]">
                      {name} <span className="font-extrabold text-[#111111]">x{qty}</span>
                      {item.selectedSize && (
                        <span className="text-[9px] text-neutral-400 font-bold ml-1.5 uppercase">
                          ({formatSize(item.selectedSize)})
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-[#111111]">₹{price * qty}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4 mt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-neutral-600">Total Paid</span>
            <span className="text-2xl font-black text-[#111111]">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link
          href={`/my-orders/${order.orderId || order.orderNumber}`}
          className="block w-full text-center border border-neutral-200 text-neutral-750 py-3.5 rounded-xl font-bold hover:bg-neutral-50 hover:text-black transition text-sm shadow-sm"
        >
          Track Order Progress ➔
        </Link>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-[#38BDF8] text-black py-4 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition cursor-pointer text-sm shadow-md"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-[#111111] flex items-center justify-center p-6 font-sans">
      <Suspense fallback={
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#38BDF8] mb-4"></div>
          <p className="text-neutral-500 text-sm">Loading checkout confirmation details...</p>
        </div>
      }>
        <OrderSuccessPageContent />
      </Suspense>
    </main>
  );
}
