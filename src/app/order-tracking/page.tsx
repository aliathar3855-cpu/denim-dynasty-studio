"use client";

import { useState, useEffect, Suspense } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any | null>(null);

  // Pre-fill Order ID if passed as query parameter
  useEffect(() => {
    if (searchParams) {
      const orderNum = searchParams.get("orderNumber");
      if (orderNum) {
        setOrderId(orderNum);
      }
    }
  }, [searchParams]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);

    const inputId = orderId.trim();
    if (!inputId || !phone.trim()) {
      setError("Please enter both Order ID/Number and Phone Number.");
      return;
    }

    try {
      setLoading(true);
      let orderData: any = null;
      let orderDocId = "";

      // 1. Search by generated orderNumber (e.g. DDS-XXXXXX)
      const q = query(
        collection(db, "orders"),
        where("orderNumber", "==", inputId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        orderData = docSnap.data();
        orderDocId = docSnap.id;
      } else {
        // 2. Fallback: Search by Firestore Document ID
        const docRef = doc(db, "orders", inputId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          orderData = snapshot.data();
          orderDocId = snapshot.id;
        }
      }

      if (!orderData) {
        setError("No order found with the provided Order Number.");
        return;
      }

      const customerPhone = orderData.customer?.phone || "";

      // Clean phone numbers of spaces, dashes, parentheses, or +91 for matching
      const cleanInputPhone = phone.replace(/[^0-9]/g, "");
      const cleanDbPhone = customerPhone.replace(/[^0-9]/g, "");

      // Allow suffix match (last 10 digits) to handle international format differences
      const suffixInput = cleanInputPhone.slice(-10);
      const suffixDb = cleanDbPhone.slice(-10);

      if (suffixInput !== suffixDb || suffixInput.length < 10) {
        setError("Phone number verification failed. Please check the number entered.");
        return;
      }

      setOrder({
        id: orderDocId,
        ...orderData,
      });
    } catch (err) {
      console.error(err);
      setError("An error occurred while retrieving order data.");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: string, currentStatus: string) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIdx = statusOrder.indexOf(currentStatus.toLowerCase());
    const stepIdx = statusOrder.indexOf(step.toLowerCase());

    if (currentIdx === -1 || stepIdx === -1) {
      return step === "pending" ? "completed" : "pending";
    }

    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  const steps = [
    { key: "pending", label: "Order Placed", desc: "Your order has been recorded." },
    { key: "processing", label: "Processing", desc: "We are preparing your items." },
    { key: "shipped", label: "Shipped", desc: "Your package is on its way." },
    { key: "delivered", label: "Delivered", desc: "Order has been delivered." },
  ];

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-10 font-sans">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between max-w-4xl mx-auto mb-12 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          Back to Shop
        </Link>
      </nav>

      {/* Tracker Lookup Card */}
      <div className="max-w-md mx-auto mb-10">
        <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-black tracking-tight mb-2 text-center text-[#111111]">
            Track Your Order
          </h1>
          <p className="text-[#666666] text-xs text-center mb-6">
            Enter the details sent to your phone/email on purchase receipt.
          </p>

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">
                Order tracking number
              </label>
              <input
                type="text"
                placeholder="e.g. DDS-K8F2D5X9"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full p-4 text-sm rounded-xl bg-white border border-neutral-300 outline-none focus:border-neutral-500 text-[#111111] transition font-mono uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">
                Customer Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-4 text-sm rounded-xl bg-white border border-neutral-300 outline-none focus:border-neutral-500 text-[#111111] transition"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs mt-2 text-center border border-red-200 bg-red-50 py-2.5 rounded-lg">
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
                  Searching Order...
                </>
              ) : (
                "Track Status"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Tracking Results Output */}
      {order && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
          
          {/* Status Timeline */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <h2 className="text-xl font-bold text-[#111111]">Shipping Progress</h2>
              {order.orderNumber && (
                <span className="bg-[#f8f8f8] border border-neutral-200 px-4 py-2 rounded-2xl font-mono text-sm text-[#111111] font-bold select-all">
                  Order Number: {order.orderNumber}
                </span>
              )}
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 relative">
              {steps.map((step, idx) => {
                const status = getStepStatus(step.key, order.status || "pending");
                
                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border font-bold text-sm transition-all duration-350 shadow-sm ${
                        status === "completed"
                          ? "bg-green-55 border-green-600 text-green-700 shadow-sm"
                          : status === "active"
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm animate-pulse"
                          : "bg-white border-neutral-300 text-neutral-400"
                      }`}
                    >
                      {status === "completed" ? "✓" : idx + 1}
                    </div>

                    <h3 className="font-semibold text-sm mt-4 text-[#111111]">
                      {step.label}
                    </h3>
                    <p className="text-[#666666] text-xs mt-1 px-4 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Delivery Details */}
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider">
                Recipient Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[#666666] text-xs block">Customer Name</span>
                  <span className="font-bold text-[#111111]">{order.customer?.name}</span>
                </div>
                <div>
                  <span className="text-[#666666] text-xs block">Shipping Address</span>
                  <span className="font-semibold text-[#111111] block leading-relaxed">
                    {order.customer?.address}, {order.customer?.city} - {order.customer?.pincode}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] text-xs block">Payment Info</span>
                  <span className="font-semibold text-[#111111] block capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Checkout"}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Cart List Summary */}
            <div className="bg-[#f8f8f8] border border-neutral-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider">
                Cart Items
              </h3>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                {(order.products || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-white border border-neutral-200/80 rounded-2xl p-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-neutral-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-[#111111] truncate">{item.name}</p>
                      <p className="text-[10px] text-[#666666] mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs text-[#111111]">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between items-center px-1">
                <span className="text-xs text-[#666666] font-semibold">Grand Total</span>
                <span className="text-xl font-black text-[#111111]">₹{order.total || 0}</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-[#666666] text-sm">Loading Order Tracker...</p>
        </div>
      </main>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
