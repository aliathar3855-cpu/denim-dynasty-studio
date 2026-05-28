"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    const snap = await getDocs(collection(db, "orders"));

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "orders", id), {
      status,
    });

    fetchOrders();
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      <h1 className="text-4xl font-bold mb-10">
        Orders Panel
      </h1>

      <div className="space-y-6">

        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-zinc-900 p-6 rounded-2xl space-y-3"
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
            <div className="flex gap-3 flex-wrap">

              <span className="px-3 py-1 bg-zinc-800 rounded-full">
                {order.status || "pending"}
              </span>

              <button
                onClick={() => updateStatus(order.id, "confirmed")}
                className="px-3 py-1 bg-blue-600 rounded-xl"
              >
                Confirm
              </button>

              <button
                onClick={() => updateStatus(order.id, "shipped")}
                className="px-3 py-1 bg-yellow-600 rounded-xl"
              >
                Ship
              </button>

              <button
                onClick={() => updateStatus(order.id, "delivered")}
                className="px-3 py-1 bg-green-600 rounded-xl"
              >
                Deliver
              </button>

            </div>

          </div>
        ))}

      </div>
    </main>
  );
}