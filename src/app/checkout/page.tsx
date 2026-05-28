"use client";

import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function CheckoutPage() {

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("online");

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(cart);

    const totalPrice = cart.reduce(
      (acc: number, item: any) =>
        acc + item.price * item.quantity,
      0
    );

    setTotal(totalPrice);
  }, []);

  const saveOrder = async (paymentId?: string, status = "pending") => {
    await addDoc(collection(db, "orders"), {
      customer: { name, phone, address, city, pincode },
      products: cartItems,
      total,
      paymentMethod,
      paymentId: paymentId || null,
      status,
      createdAt: new Date(),
    });
  };

  const handlePlaceOrder = async () => {

    if (!name || !phone || !address || !city || !pincode) {
      alert("Please fill all fields");
      return;
    }

    try {

      // COD
      if (paymentMethod === "cod") {
        await saveOrder(undefined, "COD");
        alert("COD Order placed");
        localStorage.removeItem("cart");
        setCartItems([]);
        return;
      }

      // ONLINE
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Denim Dynasty Studio",

        handler: async function (response: any) {
          await saveOrder(response.razorpay_payment_id, "PAID");
          alert("Payment Successful!");
          localStorage.removeItem("cart");
          setCartItems([]);
        },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();

    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      <h1 className="text-4xl font-bold mb-10">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* FORM */}
        <div className="space-y-5">

          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-zinc-900 rounded-xl" />
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-zinc-900 rounded-xl" />
          <textarea placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-4 bg-zinc-900 rounded-xl h-28" />
          <input placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="w-full p-4 bg-zinc-900 rounded-xl" />
          <input placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full p-4 bg-zinc-900 rounded-xl" />

          {/* PAYMENT */}
          <div className="flex gap-4 mt-4">

            <button onClick={() => setPaymentMethod("online")} className={paymentMethod === "online" ? "bg-white text-black px-4 py-2 rounded-xl" : "bg-zinc-800 px-4 py-2 rounded-xl"}>
              Pay Online
            </button>

            <button onClick={() => setPaymentMethod("cod")} className={paymentMethod === "cod" ? "bg-white text-black px-4 py-2 rounded-xl" : "bg-zinc-800 px-4 py-2 rounded-xl"}>
              COD
            </button>

          </div>

        </div>

        {/* SUMMARY */}
        <div className="bg-zinc-900 p-6 rounded-3xl">

          {cartItems.map((item, i) => (
            <div key={i} className="flex justify-between mb-4">
              <span>{item.name}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}

          <div className="border-t pt-4 mt-4 text-xl font-bold">
            Total: ₹{total}
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full mt-6 bg-white text-black py-3 rounded-xl font-bold"
          >
            Place Order
          </button>

        </div>

      </div>

    </main>
  );
}