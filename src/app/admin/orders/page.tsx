"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase/config";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import AdminGuard from "@/components/AdminGuard";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Expanded states for detailed product list accordion
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersList: any[] = [];
      snapshot.forEach((docItem) => {
        ordersList.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });
      setOrders(ordersList);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Send email notifications for shipped and delivered updates
      if (newStatus === "shipped" || newStatus === "delivered") {
        try {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, action: newStatus }),
          });
        } catch (mailErr) {
          console.error("Mail trigger error:", mailErr);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete/archive this order?")) return;

    try {
      setUpdatingId(orderId);
      const docRef = doc(db, "orders", orderId);
      await deleteDoc(docRef);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete order.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics calculations
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "processing" || order.status === "shipped"
  ).length;
  const completedOrders = orders.filter((order) => order.status === "delivered").length;

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "N/A";
    if (createdAt.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleString();
    }
    if (createdAt.toDate) {
      return createdAt.toDate().toLocaleString();
    }
    return new Date(createdAt).toLocaleString();
  };

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-black text-white p-6 md:p-10 font-sans">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-zinc-500 bg-clip-text text-transparent">
              Order Management
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              View customer details, update tracking statuses, and analyze business metrics.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 px-5 py-2.5 rounded-xl font-semibold transition text-sm"
            >
              Manage Products
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-950 border border-red-800 hover:bg-red-900 text-red-200 px-5 py-2.5 rounded-xl font-semibold transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-bold mt-2 text-white">{totalOrders}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold mt-2 text-green-400">₹{totalRevenue}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Active/Pending</p>
            <p className="text-3xl font-bold mt-2 text-yellow-400">{pendingOrders}</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Delivered</p>
            <p className="text-3xl font-bold mt-2 text-blue-400">{completedOrders}</p>
          </div>
        </div>

        {/* Orders Table Section */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Invoices</h2>
            <button
              onClick={fetchOrders}
              className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p className="text-lg">Fetching orders from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-20 text-center text-zinc-500">
              <p className="text-2xl font-bold">No orders found</p>
              <p className="text-sm mt-1">Orders placed by customers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/60 text-xs text-zinc-400 uppercase border-b border-zinc-800/80">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const c = order.customer || {};

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-zinc-900/30 transition-colors ${
                          isExpanded ? "bg-zinc-900/20" : ""
                        }`}
                      >
                        {/* Customer Column */}
                        <td className="px-6 py-4">
                          {order.orderNumber && (
                            <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-zinc-300 font-bold block w-max mb-1">
                              {order.orderNumber}
                            </span>
                          )}
                          <div className="font-semibold text-white">{c.name || "N/A"}</div>
                          <div className="text-zinc-500 text-xs">{c.phone || "No phone"}</div>
                        </td>

                        {/* Date Column */}
                        <td className="px-6 py-4 text-zinc-300">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Payment Column */}
                        <td className="px-6 py-4">
                          <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {order.paymentMethod === "cod" ? "COD" : "Online"}
                          </span>
                          {order.paymentId && (
                            <div className="text-zinc-500 text-[10px] mt-1 truncate max-w-[120px]">
                              {order.paymentId}
                            </div>
                          )}
                        </td>

                        {/* Amount Column */}
                        <td className="px-6 py-4 font-bold text-white">
                          ₹{order.total || 0}
                        </td>

                        {/* Status Select Column */}
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition ${
                              order.status === "delivered"
                                ? "bg-green-950/40 text-green-300 border-green-800"
                                : order.status === "shipped"
                                ? "bg-blue-950/40 text-blue-300 border-blue-800"
                                : order.status === "processing"
                                ? "bg-purple-950/40 text-purple-300 border-purple-800"
                                : "bg-yellow-950/40 text-yellow-300 border-yellow-800"
                            }`}
                          >
                            <option value="pending" className="bg-black text-white">Pending</option>
                            <option value="processing" className="bg-black text-white">Processing</option>
                            <option value="shipped" className="bg-black text-white">Shipped</option>
                            <option value="delivered" className="bg-black text-white">Delivered</option>
                          </select>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              className="text-xs text-zinc-400 hover:text-white transition font-medium"
                            >
                              {isExpanded ? "Collapse" : "Details"}
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={updatingId === order.id}
                              className="text-xs text-red-500 hover:text-red-400 transition font-medium"
                            >
                              Delete
                            </button>
                          </div>

                          {/* Expanded products block rendered outside but toggled */}
                          {isExpanded && (
                            <div className="hidden">Expanded row markup inside TD helper</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Order view cards for expanded order */}
        {expandedOrderId && (
          (() => {
            const selectedOrder = orders.find((o) => o.id === expandedOrderId);
            if (!selectedOrder) return null;
            const c = selectedOrder.customer || {};

            return (
              <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 animate-fadeIn">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-5 mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Order Details</h3>
                    <p className="text-xs text-zinc-500 mt-1">ID: {selectedOrder.id}</p>
                  </div>
                  <button
                    onClick={() => setExpandedOrderId(null)}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    Close ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Customer Information Card */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                      Customer & Shipping Details
                    </h4>
                    <div className="bg-black/40 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
                      <div>
                        <span className="text-xs text-zinc-500 block">Recipient Name</span>
                        <span className="text-sm font-semibold">{c.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">Phone Connection</span>
                        <span className="text-sm font-semibold">{c.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 block">Address Info</span>
                        <span className="text-sm font-semibold leading-relaxed">
                          {c.address || "N/A"}, {c.city || "N/A"} - {c.pincode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                      Items Ordered
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {(selectedOrder.products || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 bg-black/40 border border-zinc-800/60 rounded-2xl p-4"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl border border-zinc-800"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Qty: {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-white">
                              ₹{item.price * item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-zinc-800 pt-4 mt-4 flex justify-between items-center px-2">
                      <span className="text-zinc-400 font-semibold">Aggregate Invoice</span>
                      <span className="text-2xl font-extrabold text-white">
                        ₹{selectedOrder.total || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

      </main>
    </AdminGuard>
  );
}
