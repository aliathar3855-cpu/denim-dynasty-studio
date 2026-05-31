"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH ORDERS
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const snap = await onSnapshot(collection(db, "orders"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // safe sort (avoid crash if createdAt missing)
      data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // UPDATE STATUS
  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });

      // instant UI update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status } : o
        )
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading orders...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      <h1 className="text-4xl font-bold mb-10">
        Orders Panel
      </h1>

      <div className="space-y-6">

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 p-6 rounded-2xl space-y-4"
          >

            {/* CUSTOMER */}
            <div>
              <h2 className="text-xl font-bold">
                {order.customer?.name}
              </h2>

              <p className="text-gray-400">
                {order.customer?.phone}
              </p>

              <p className="text-gray-400">
                {order.customer?.address}, {order.customer?.city}
              </p>
            </div>

            {/* PRODUCTS */}
            <div className="text-sm text-gray-300">
              {order.products?.map((p: any, i: number) => (
                <div key={i}>
                  {p.name} × {p.quantity}
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="text-lg font-bold">
              ₹{order.total}
            </div>

            {/* STATUS */}
            <div className="flex items-center gap-4 flex-wrap">

              <span className="px-3 py-1 bg-zinc-800 rounded-full">
                {order.status || "pending"}
              </span>

              <select
                value={order.status || "pending"}
                onChange={(e) =>
                  updateStatus(order.id, e.target.value)
                }
                className="bg-zinc-800 px-3 py-2 rounded-xl"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>

            </div>

          </div>
        ))}

      </div>
    </main>
  );
}