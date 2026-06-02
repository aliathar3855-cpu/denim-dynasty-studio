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
import { toast } from "react-hot-toast";

const normalizeOrder = (docId: string, data: any) => {
  let name = "";
  let phone = "";
  let address = "";
  let city = "";
  let pincode = "";
  let email = "";

  if (data.customer) {
    name = data.customer.name || `${data.customer.firstName || ""} ${data.customer.lastName || ""}`.trim();
    phone = data.customer.phone || "";
    address = data.customer.address || `${data.customer.addressLine1 || ""}${data.customer.addressLine2 ? ", " + data.customer.addressLine2 : ""}`.trim();
    city = data.customer.city || "";
    pincode = data.customer.pincode || "";
    email = data.customer.email || "";
  } else if (data.userDetails) {
    name = `${data.userDetails.firstName || ""} ${data.userDetails.lastName || ""}`.trim();
    phone = data.userDetails.phone || "";
    address = `${data.userDetails.address1 || ""}${data.userDetails.address2 ? ", " + data.userDetails.address2 : ""}`.trim();
    city = data.userDetails.city || "";
    pincode = data.userDetails.pincode || "";
    email = data.userDetails.email || "";
  }

  let productsList = [];
  if (Array.isArray(data.products)) {
    productsList = data.products.map((p: any) => ({
      name: p.name || "",
      imageUrl: p.imageUrl || p.image || "",
      price: Number(p.price) || 0,
      quantity: Number(p.quantity) || 1,
      selectedSize: p.selectedSize || ""
    }));
  } else if (Array.isArray(data.items)) {
    productsList = data.items.map((p: any) => ({
      name: p.name || "",
      imageUrl: p.image || p.imageUrl || "",
      price: Number(p.price) || 0,
      quantity: Number(p.quantity) || 1,
      selectedSize: p.selectedSize || ""
    }));
  }

  const status = (data.status || data.orderStatus || "pending").toLowerCase();
  const total = Number(data.total || data.totalAmount || 0);

  return {
    id: docId,
    orderNumber: data.orderNumber || data.orderId || docId,
    customer: {
      name,
      phone,
      address,
      city,
      pincode,
      email
    },
    products: productsList,
    total,
    status,
    paymentMethod: data.paymentMethod || "COD",
    paymentStatus: data.paymentStatus || "Pending",
    paymentId: data.paymentId || null,
    createdAt: data.createdAt
  };
};

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
      const ordersList = snapshot.docs.map((docItem) =>
        normalizeOrder(docItem.id, docItem.data())
      );
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
      localStorage.removeItem("admin");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, {
        status: newStatus.toLowerCase(),
        orderStatus: newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase(),
      });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus.toLowerCase() } : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);

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
      toast.error("Failed to update order status.");
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
      toast.success("Order deleted successfully");
      if (expandedOrderId === orderId) {
        setExpandedOrderId(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      toast.error("Failed to delete order.");
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
      <main className="min-h-screen bg-white text-[#111111] p-6 md:p-10 font-sans max-w-6xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#111111]">
              Order Management
            </h1>
            <p className="text-[#666666] text-sm mt-1">
              View customer details, update tracking statuses, and analyze business metrics.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="bg-[#f8f8f8] border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 px-5 py-2.5 rounded-xl font-semibold transition text-sm cursor-pointer text-[#111111]"
            >
              Manage Products
            </button>
            <button
              onClick={handleLogout}
              className="border border-red-200 text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold transition text-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-black mt-2 text-[#111111]">{totalOrders}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-black mt-2 text-green-600">₹{totalRevenue}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wider">Active/Pending</p>
            <p className="text-3xl font-black mt-2 text-amber-600">{pendingOrders}</p>
          </div>
          <div className="bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 shadow-sm">
            <p className="text-xs text-[#666666] font-bold uppercase tracking-wider">Delivered</p>
            <p className="text-3xl font-black mt-2 text-blue-600">{completedOrders}</p>
          </div>
        </div>

        {/* Orders Table Section */}
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111111]">Recent Invoices</h2>
            <button
              onClick={fetchOrders}
              className="text-xs text-[#666666] hover:text-[#111111] transition flex items-center gap-1 cursor-pointer"
            >
              🔄 Refresh List
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center text-[#666666]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
              <p className="text-lg">Fetching orders from database...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-20 text-center text-neutral-400">
              <p className="text-2xl font-bold">No orders found</p>
              <p className="text-sm mt-1">Orders placed by customers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f8f8] text-xs text-[#666666] uppercase border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const c = order.customer || {};

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-neutral-50/50 transition-colors ${
                          isExpanded ? "bg-neutral-50" : ""
                        }`}
                      >
                        {/* Customer Column */}
                        <td className="px-6 py-4">
                          {order.orderNumber && (
                            <span className="text-[10px] font-mono bg-[#f8f8f8] border border-neutral-200 px-2 py-0.5 rounded text-[#111111] font-bold block w-max mb-1">
                              {order.orderNumber}
                            </span>
                          )}
                          <div className="font-semibold text-[#111111]">{c.name || "N/A"}</div>
                          <div className="text-[#666666] text-xs">{c.phone || "No phone"}</div>
                        </td>

                        {/* Date Column */}
                        <td className="px-6 py-4 text-[#111111]">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Payment Column */}
                        <td className="px-6 py-4">
                          <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-[#111111] border border-neutral-200">
                            {order.paymentMethod === "cod" ? "COD" : "Online"}
                          </span>
                          {order.paymentId && (
                            <div className="text-[#666666] text-[10px] mt-1 truncate max-w-[120px]">
                              {order.paymentId}
                            </div>
                          )}
                        </td>

                        {/* Amount Column */}
                        <td className="px-6 py-4 font-bold text-[#111111]">
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
                                ? "bg-green-50 text-green-750 border-green-200"
                                : order.status === "shipped"
                                ? "bg-blue-50 text-blue-750 border-blue-200"
                                : order.status === "processing"
                                ? "bg-purple-50 text-purple-750 border-purple-200"
                                : "bg-amber-50 text-amber-750 border-amber-200"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => toggleExpandOrder(order.id)}
                              className="text-xs text-[#666666] hover:text-[#111111] transition font-semibold cursor-pointer"
                            >
                              {isExpanded ? "Collapse" : "Details"}
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={updatingId === order.id}
                              className="text-xs text-red-650 hover:text-red-800 transition font-semibold cursor-pointer"
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
              <div className="mt-8 bg-[#f8f8f8] border border-neutral-200 rounded-3xl p-6 md:p-8 animate-fadeIn">
                <div className="flex justify-between items-start border-b border-neutral-200 pb-5 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#111111]">Order Details</h3>
                    <p className="text-xs text-[#666666] mt-1">ID: {selectedOrder.id}</p>
                  </div>
                  <button
                    onClick={() => setExpandedOrderId(null)}
                    className="text-[#666666] hover:text-black text-sm cursor-pointer"
                  >
                    Close ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Customer Information Card */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[#666666]">
                      Customer & Shipping Details
                    </h4>
                    <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
                      <div>
                        <span className="text-xs text-[#666666] block">Recipient Name</span>
                        <span className="text-sm font-semibold text-[#111111]">{c.name || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#666666] block">Phone Connection</span>
                        <span className="text-sm font-semibold text-[#111111]">{c.phone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#666666] block">Address Info</span>
                        <span className="text-sm font-semibold text-[#111111] leading-relaxed">
                          {c.address || "N/A"}, {c.city || "N/A"} - {c.pincode || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[#666666] mb-4">
                      Items Ordered
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {(selectedOrder.products || []).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl p-4"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl border border-neutral-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#111111] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#666666] mt-1">
                              Qty: {item.quantity} × ₹{item.price}
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

                    <div className="border-t border-neutral-200 pt-4 mt-4 flex justify-between items-center px-2">
                      <span className="text-[#666666] font-semibold">Aggregate Invoice</span>
                      <span className="text-2xl font-extrabold text-[#111111]">
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
