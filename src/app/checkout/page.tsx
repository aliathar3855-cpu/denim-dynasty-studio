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

      {/* Trust Section */}
      <section className="border-t border-neutral-200 bg-[#f8f8f8] py-16 px-6 md:px-12 rounded-3xl mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="flex items-start gap-4">
            <div className="text-[#111111] shrink-0 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm6.45 6.45a2.886 2.886 0 0 0 0 4.1M13.75 12h.008v.008h-.008V12Zm0 2.25h.008v.008h-.008v-.008ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0-9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Cash on Delivery</h4>
              <p className="text-xs text-[#666666] mt-1">Pay comfortably in cash upon package delivery.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-[#111111] shrink-0 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.266-.852-.676-1.03l-2.456-1.07A1.125 1.125 0 0 0 14.25 9.75h-2.25V4.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h1.5"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Fast Shipping</h4>
              <p className="text-xs text-[#666666] mt-1">Quick and reliable delivery across all pin codes in India.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-[#111111] shrink-0 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">100% Secure</h4>
              <p className="text-xs text-[#666666] mt-1">Encrypted checkouts and trusted payment gateways.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="text-[#111111] shrink-0 mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Easy Returns</h4>
              <p className="text-xs text-[#666666] mt-1">Size exchanges and support within 7 days of receipt.</p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}