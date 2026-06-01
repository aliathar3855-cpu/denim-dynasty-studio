"use client";

import { useEffect, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useCart();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Expanded fields for production-ready checkout
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country] = useState("India"); // Default India, readonly
  const [notes, setNotes] = useState("");

  // Validation errors & loading state
  const [errors, setErrors] = useState<any>({});
  const [autofilling, setAutofilling] = useState(false);

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

  // Autofill City & State when 6-digit Pincode is entered
  useEffect(() => {
    const autoFillLocation = async () => {
      const cleanPin = pincode.replace(/[^0-9]/g, "");
      if (cleanPin.length === 6) {
        setAutofilling(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
            const office = data[0].PostOffice[0];
            if (office.District) {
              setCity(office.District);
            }
            if (office.State) {
              setState(office.State);
            }
            // Clear pincode error if details were retrieved
            setErrors((prev: any) => {
              const copy = { ...prev };
              delete copy.pincode;
              delete copy.city;
              delete copy.state;
              return copy;
            });
          }
        } catch (err) {
          console.error("Postal Pincode API lookup error:", err);
        } finally {
          setAutofilling(false);
        }
      }
    };

    autoFillLocation();
  }, [pincode]);

  // GENERATE UNIQUE ORDER NUMBER
  const generateOrderNumber = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DDS-${result}`;
  };

  // Form level validations
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Invalid email format";
    }

    if (!addressLine1.trim()) newErrors.addressLine1 = "Address is required";

    const cleanPin = pincode.replace(/[^0-9]/g, "");
    if (!cleanPin) {
      newErrors.pincode = "Pincode is required";
    } else if (cleanPin.length !== 6) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!city.trim()) newErrors.city = "City/District is required";
    if (!state.trim()) newErrors.state = "State is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SAVE ORDER TO FIRESTORE
  const saveOrder = async (paymentId?: string, status = "pending") => {
    const orderNumber = generateOrderNumber();
    
    // Synthesize name and address for full backwards compatibility
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const fullAddress = `${addressLine1.trim()}${
      addressLine2.trim() ? ", " + addressLine2.trim() : ""
    }${landmark.trim() ? " (Landmark: " + landmark.trim() + ")" : ""}`;

    const docRef = await addDoc(collection(db, "orders"), {
      orderNumber,
      customer: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName, // legacy compatibility
        email: email.trim(),
        phone: phone.replace(/[^0-9]/g, ""),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        landmark: landmark.trim(),
        address: fullAddress, // legacy compatibility
        pincode: pincode.replace(/[^0-9]/g, ""),
        city: city.trim(),
        state: state.trim(),
        country,
        notes: notes.trim(),
      },
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
    if (!validateForm()) {
      showToast("Please fix all validation errors before proceeding.", "error");
      return;
    }

    try {
      // COD ORDER
      if (paymentMethod === "cod") {
        const orderNumber = await saveOrder(undefined, "cod");

        localStorage.removeItem("cart");
        setCartItems([]);

        showToast("Order placed successfully!", "success");
        router.push(`/my-orders/${orderNumber}`);
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

            showToast("Payment successful! Order placed.", "success");
            router.push(`/my-orders/${orderNumber}`);

          } catch (err) {
            console.error("Order saving failed:", err);
            showToast("Payment succeeded but order saving failed.", "error");
          }
        },

        theme: {
          color: "#38BDF8",
        },
      };

      const razor = new (window as any).Razorpay(options);
      razor.open();

    } catch (err) {
      console.log(err);
      showToast("Something went wrong while placing order.", "error");
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto">

      {/* Top Navbar */}
      <nav className="flex items-center justify-between mb-10 border-b border-neutral-200 pb-5">
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
        <Link href="/cart" className="text-sm text-neutral-500 hover:text-[#38BDF8] transition">
          ➔ Back to Cart
        </Link>
      </nav>

      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111]">
        Checkout
      </h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* FORM */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-neutral-800 border-b border-neutral-100 pb-2 mb-4">
            Billing & Shipping Details
          </h2>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                placeholder="First Name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.firstName ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.firstName && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.firstName}</span>}
            </div>
            <div>
              <input
                placeholder="Last Name *"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.lastName ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.lastName && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.lastName}</span>}
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                placeholder="Phone (10 Digits) *"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.phone ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.phone && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.phone}</span>}
            </div>
            <div>
              <input
                placeholder="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.email ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.email && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.email}</span>}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <input
              placeholder="Address Line 1 (Flat, House no., Building, Street) *"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                errors.addressLine1 ? "border-red-550" : "border-neutral-300"
              }`}
            />
            {errors.addressLine1 && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.addressLine1}</span>}
          </div>

          {/* Address Line 2 */}
          <input
            placeholder="Address Line 2 (Area, Colony, Road, Sector) (Optional)"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
          />

          {/* Landmark & Pincode */}
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Landmark (Optional)"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition"
            />
            <div>
              <div className="relative">
                <input
                  placeholder="Pincode (6 Digits) *"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                    errors.pincode ? "border-red-550" : "border-neutral-300"
                  }`}
                />
                {autofilling && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-semibold animate-pulse">
                    Autofilling...
                  </span>
                )}
              </div>
              {errors.pincode && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.pincode}</span>}
            </div>
          </div>

          {/* City & State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                placeholder="City/District *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.city ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.city && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.city}</span>}
            </div>
            <div>
              <input
                placeholder="State *"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.state ? "border-red-550" : "border-neutral-300"
                }`}
              />
              {errors.state && <span className="text-red-650 text-[10px] block mt-1 ml-1">{errors.state}</span>}
            </div>
          </div>

          {/* Country (Default India, disabled) */}
          <input
            value={country}
            disabled
            className="w-full p-4 bg-neutral-100 border border-neutral-300 rounded-xl outline-none text-sm text-neutral-500 transition cursor-not-allowed"
          />

          {/* Order Notes */}
          <div>
            <textarea
              placeholder="Order Notes (e.g. instruction for delivery, apartment access code, bulk preferences) (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition h-24 resize-none"
            />
          </div>

          {/* PAYMENT OPTIONS */}
          <div className="pt-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-3">
              Payment Method
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod("online")}
                className={
                  paymentMethod === "online"
                    ? "bg-[#38BDF8] text-black px-5 py-2.5 rounded-xl font-bold border border-[#38BDF8] cursor-pointer text-sm shadow-sm"
                    : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition cursor-pointer text-sm"
                }
              >
                Pay Online
              </button>

              <button
                onClick={() => setPaymentMethod("cod")}
                className={
                  paymentMethod === "cod"
                    ? "bg-[#38BDF8] text-black px-5 py-2.5 rounded-xl font-bold border border-[#38BDF8] cursor-pointer text-sm shadow-sm"
                    : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition cursor-pointer text-sm"
                }
              >
                COD (Cash on Delivery)
              </button>
            </div>
          </div>

        </div>

        {/* SUMMARY */}
        <div className="bg-[#f8f8f8] border border-neutral-200 p-6 rounded-2xl h-max sticky top-5">

          <h3 className="text-lg font-bold text-[#111111] mb-6">Order Review</h3>

          {cartItems.map((item, i) => (
            <div key={i} className="flex justify-between mb-4 text-[#666666] font-medium text-sm">
              <div>
                <span>{item.name} (x{item.quantity})</span>
                {item.selectedSize && (
                  <span className="block text-xs text-neutral-400 mt-0.5">Size: {item.selectedSize}</span>
                )}
              </div>
              <span className="text-[#111111] font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}

          <div className="border-t border-neutral-200 pt-4 mt-4 text-xl font-black text-[#111111] flex justify-between">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full mt-6 bg-[#38BDF8] text-black py-4 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-md cursor-pointer text-sm"
          >
            Place Order
          </button>

        </div>

      </div>

      {/* Trust Section */}
      <section className="border-t border-neutral-200 bg-white py-12 px-6 md:px-12 mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm6.45 6.45a2.886 2.886 0 0 0 0 4.1M13.75 12h.008v.008h-.008V12Zm0 2.25h.008v.008h-.008v-.008ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0-9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide whitespace-nowrap">
              ✓ Cash on Delivery Available
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.266-.852-.676-1.03l-2.456-1.07A1.125 1.125 0 0 0 14.25 9.75h-2.25V4.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h1.5"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide whitespace-nowrap">
              ✓ Fast Shipping Across India
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide whitespace-nowrap">
              ✓ 100% Secure Payments
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide whitespace-nowrap">
              ✓ Easy Returns & Customer Support
            </span>
          </div>

        </div>
      </section>

    </main>
  );
}