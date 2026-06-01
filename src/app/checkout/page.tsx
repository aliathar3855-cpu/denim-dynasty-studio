"use client";

import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  // GENERATE UNIQUE ORDER NUMBER
  const generateOrderNumber = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DDS-${result}`;
  };

  // SAVE ORDER TO FIRESTORE
  const saveOrder = async (paymentId?: string, status = "pending") => {
    const orderNumber = generateOrderNumber();
    const docRef = await addDoc(collection(db, "orders"), {
      orderNumber,
      customer: { name, email, phone, address, city, pincode },
      products: cartItems,
      total,
      paymentMethod,
      paymentId: paymentId || null,
      status,
      createdAt: new Date(),
    });

    try {
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: docRef.id, action: "placed" }),
      });
    } catch (err) {
      console.error("Email notification error:", err);
    }

    return orderNumber;
  };

  const handlePlaceOrder = async () => {
    if (!name || !email || !phone || !address || !city || !pincode) {
      alert("Please fill all fields");
      return;
    }

    try {
      // COD ORDER
      if (paymentMethod === "cod") {
        const orderNumber = await saveOrder(undefined, "cod");

        localStorage.removeItem("cart");
        setCartItems([]);

        alert(`COD Order placed! Order Number: ${orderNumber}`);
        window.location.href = `/success?orderNumber=${orderNumber}`;
        return;
      }

      // ONLINE PAYMENT
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
        name: "Denim Dynasty Studio",
        description: "Order Payment",
        order_id: order.id,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },

        handler: async function (response: any) {
          try {
            const orderNumber = await saveOrder(
              response.razorpay_payment_id,
              "paid"
            );

            localStorage.removeItem("cart");
            setCartItems([]);

            alert(`Payment Successful! Order Number: ${orderNumber}`);

            window.location.href = `/success?orderNumber=${orderNumber}`;

          } catch (err) {
            console.error("Order saving failed:", err);
            alert("Payment succeeded but order saving failed.");
          }
        },

        theme: {
          color: "#000000",
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
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto">

      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-10 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/cart" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Cart
        </Link>
      </nav>

      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111]">
        Checkout
      </h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* FORM */}
        <div className="space-y-5">

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition"
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition"
          />

          <input
            placeholder="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition"
            required
          />

          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition h-28"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition"
          />

          <input
            placeholder="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-neutral-500 text-[#111111] transition"
          />

          {/* PAYMENT */}
          <div className="flex gap-4 mt-4">

            <button
              onClick={() => setPaymentMethod("online")}
              className={
                paymentMethod === "online"
                  ? "bg-[#111111] text-white px-5 py-2.5 rounded-xl font-bold border border-black cursor-pointer"
                  : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-black hover:border-neutral-400 transition cursor-pointer"
              }
            >
              Pay Online
            </button>

            <button
              onClick={() => setPaymentMethod("cod")}
              className={
                paymentMethod === "cod"
                  ? "bg-[#111111] text-white px-5 py-2.5 rounded-xl font-bold border border-black cursor-pointer"
                  : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-black hover:border-neutral-400 transition cursor-pointer"
              }
            >
              COD (Cash on Delivery)
            </button>

          </div>

        </div>

        {/* SUMMARY */}
        <div className="bg-[#f8f8f8] border border-neutral-200 p-6 rounded-2xl">

          <h3 className="text-lg font-bold text-[#111111] mb-6">Order Review</h3>

          {cartItems.map((item, i) => (
            <div key={i} className="flex justify-between mb-4 text-[#666666] font-medium text-sm">
              <span>{item.name} (x{item.quantity})</span>
              <span className="text-[#111111] font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}

          <div className="border-t border-neutral-200 pt-4 mt-4 text-xl font-black text-[#111111] flex justify-between">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full mt-6 bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition shadow-md cursor-pointer"
          >
            Place Order
          </button>

        </div>

      </div>

    </main>
  );
}