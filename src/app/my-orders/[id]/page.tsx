"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";
import Image from "next/image";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        setLoading(true);
        setError("");

        let orderData: any = null;
        let orderDocId = "";

        // 1. Try fetching by doc ID directly
        const docRef = doc(db, "orders", id.toString());
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          orderData = snapshot.data();
          orderDocId = snapshot.id;
        } else {
          // 2. Try fetching by orderNumber (fallback)
          const q = query(
            collection(db, "orders"),
            where("orderNumber", "==", id.toString())
          );
          const qSnapshot = await getDocs(q);
          if (!qSnapshot.empty) {
            const docSnap = qSnapshot.docs[0];
            orderData = docSnap.data();
            orderDocId = docSnap.id;
          }
        }

        if (orderData) {
          setOrder({
            id: orderDocId,
            ...orderData,
          });
        } else {
          setError("No order found with the provided identifier.");
        }
      } catch (err) {
        console.error("Error loading order details:", err);
        setError("Failed to retrieve order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIdx = statusOrder.indexOf((currentStatus || "pending").toLowerCase());
    const stepIdx = statusOrder.indexOf(stepKey.toLowerCase());

    if (currentIdx === -1 || stepIdx === -1) {
      return stepKey === "pending" ? "completed" : "pending";
    }

    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  const getPaymentStatus = (paymentMethod: string, status: string, paymentId?: string) => {
    const s = (status || "pending").toLowerCase();
    const pm = (paymentMethod || "").toLowerCase();
    
    if (s === "paid" || paymentId) {
      return { text: "Paid Online", class: "text-green-700 bg-green-50 border-green-200" };
    }
    if (pm === "cod") {
      if (s === "delivered") {
        return { text: "Cash Collected (Paid)", class: "text-green-700 bg-green-50 border-green-200" };
      }
      return { text: "Cash on Delivery", class: "text-[#666666] bg-neutral-100 border-neutral-200" };
    }
    return { text: "Pending Payment", class: "text-amber-700 bg-amber-50 border-amber-200" };
  };

  const steps = [
    { key: "pending", label: "Order Placed", desc: "Your order has been recorded." },
    { key: "processing", label: "Processing", desc: "We are preparing your streetwear items." },
    { key: "shipped", label: "Shipped", desc: "Your package is on its way." },
    { key: "delivered", label: "Delivered", desc: "Your package has been successfully delivered." },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-[#666666] text-sm">Loading Order Details...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-xl mx-auto flex flex-col justify-center items-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center space-y-4 w-full">
          <h1 className="text-2xl font-bold text-red-700">Order Not Found</h1>
          <p className="text-sm text-[#666666] leading-relaxed">{error || "The order could not be located."}</p>
          <Link
            href="/my-orders"
            className="inline-block bg-[#38BDF8] text-black px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-sm"
          >
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const c = order.customer || {};
  const paymentStatus = getPaymentStatus(order.paymentMethod, order.status, order.paymentId);

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
        <div className="flex gap-4 items-center">
          <Link href="/my-orders" className="text-sm text-neutral-500 hover:text-[#38BDF8] transition">
            My Orders
          </Link>
          <span className="text-neutral-300">|</span>
          <Link href="/" className="text-sm text-neutral-500 hover:text-[#38BDF8] transition">
            Shop
          </Link>
        </div>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-neutral-100 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Receipt Overview</span>
          <h1 className="text-3xl font-black text-[#111111] mt-1">
            Order {order.orderNumber || order.id}
          </h1>
          <p className="text-xs text-[#666666] mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${paymentStatus.class}`}>
            {paymentStatus.text}
          </span>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* Shipping Timeline */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#111111] mb-8">Shipping Progress</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.key, order.status || "pending");
              return (
                <div key={step.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 relative z-10">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border font-bold text-sm transition-all duration-300 shadow-sm shrink-0 ${
                      status === "completed"
                        ? "bg-green-50 border-green-600 text-green-700"
                        : status === "active"
                        ? "bg-sky-50 border-[#38BDF8] text-sky-605 animate-pulse font-extrabold"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    {status === "completed" ? "✓" : idx + 1}
                  </div>

                  <div className="md:mt-4 text-left md:text-center">
                    <h3 className="font-semibold text-sm text-[#111111]">{step.label}</h3>
                    <p className="text-[#666666] text-xs mt-0.5 leading-relaxed md:px-3">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Customer & Shipping Details */}
          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8 space-y-6 md:col-span-1">
            <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-neutral-200 pb-2">
              Customer Details
            </h3>

            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Name</span>
                <span className="font-bold text-[#111111]">{c.name || "N/A"}</span>
              </div>

              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Phone</span>
                <span className="font-semibold text-[#111111]">{c.phone || "N/A"}</span>
              </div>

              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Email</span>
                <span className="font-semibold text-[#111111] break-all">{c.email || "N/A"}</span>
              </div>

              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Delivery Address</span>
                <span className="font-semibold text-[#111111] block">
                  {c.address || "N/A"}, {c.city || "N/A"} - {c.pincode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Cart Products List */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 md:p-8 md:col-span-2 space-y-6">
            <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Ordered Products
            </h3>

            <div className="space-y-4">
              {(order.products || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl border border-neutral-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#111111] truncate">{item.name}</h4>
                    <p className="text-xs text-[#666666] mt-1 font-medium">
                      ₹{item.price} × {item.quantity}
                    </p>
                    {item.selectedSize && (
                      <p className="text-xs text-[#999999] mt-0.5 font-bold">
                        Size: {item.selectedSize}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#111111]">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div>
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Payment Gateway Info</span>
                <span className="text-xs text-[#666666] font-medium capitalize">
                  Method: {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Checkout"}
                  {order.paymentId && ` | Txn ID: ${order.paymentId}`}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Total Amount</span>
                <span className="text-2xl font-black text-[#111111]">₹{order.total || 0}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}
