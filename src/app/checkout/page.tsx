"use client";

import { useEffect, useState, Suspense } from "react";
import { db } from "@/firebase/config";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { getProductById, formatSize } from "@/lib/products";
import { createOrder } from "@/lib/orders";
import { toast } from "react-hot-toast";
import { brandConfig } from "@/config/brand";

interface EnrichedCartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  selectedSize: string;
  quantity: number;
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, clearCart } = useCart();

  // Enriched cart item state resolved from Firestore products catalog
  const [cartItems, setCartItems] = useState<EnrichedCartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Form Fields State
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
  const [country] = useState("India"); // Default, read-only
  const [notes, setNotes] = useState("");

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autofilling, setAutofilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CASHFREE">("CASHFREE");
  const [submitting, setSubmitting] = useState(false);

  // Load failed/cancelled payment toast notifications on mount
  useEffect(() => {
    const errorParam = searchParams ? searchParams.get("error") : null;
    if (errorParam === "payment_failed") {
      toast.error("Online payment failed or was cancelled. Please try again.", {
        duration: 6000,
      });
    }
  }, [searchParams]);

  // Load Cashfree script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 2. Fetch full product details from Firestore using active cart context mapping
  useEffect(() => {
    const resolveCart = async () => {
      console.log(`[Cart Retrieval] Resolving cart items from state:`, cart);
      setLoadingCart(true);
      try {
        if (cart.length === 0) {
          setCartItems([]);
          setTotal(0);
          setLoadingCart(false);
          return;
        }

        // Verify if any items are missing selected sizes
        const sizeMissing = cart.some(
          (item: any) => !item.selectedSize || item.selectedSize.trim() === ""
        );
        if (sizeMissing) {
          console.warn(`[Checkout Resolution] Size validation warning: size is missing for one or more items.`);
          toast.error("One or more items in your cart do not have a size selected. Please resolve before placing an order.", {
            duration: 6000,
          });
        }

        // Enrich items list
        const resolved = await Promise.all(
          cart.map(async (item: any) => {
            const productId = item.productId || item.id;
            const product = await getProductById(productId);
            if (product) {
              return {
                productId,
                name: product.name,
                price: Number(product.price),
                image: product.images?.[0] || item.image || "",
                selectedSize: item.selectedSize || "",
                quantity: item.quantity || 1,
              };
            }
            return null;
          })
        );

        const enriched = resolved.filter((item): item is EnrichedCartItem => item !== null);
        console.log(`[Checkout Resolution] Cart successfully enriched:`, enriched);

        setCartItems(enriched);
        const totalPrice = enriched.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotal(totalPrice);
      } catch (err) {
        console.error("Cart resolution error:", err);
        toast.error("Failed to load checkout cart items.");
      } finally {
        setLoadingCart(false);
      }
    };

    resolveCart();
  }, [cart]);

  // 3. Pincode Auto-Fill
  useEffect(() => {
    const autoFillLocation = async () => {
      const cleanPin = pincode.replace(/[^0-9]/g, "");
      if (cleanPin.length === 6) {
        setAutofilling(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const office = data[0].PostOffice[0];
            setCity(office.District || "");
            setState(office.State || "");
            setErrors((prev) => {
              const copy = { ...prev };
              delete copy.pincode;
              delete copy.city;
              delete copy.state;
              return copy;
            });
            toast.success("Location auto-filled successfully!");
          } else {
            toast.error("Invalid pincode entered. Please check and try again.");
            setCity("");
            setState("");
            setErrors((prev) => ({
              ...prev,
              pincode: "Invalid pincode"
            }));
          }
        } catch (err) {
          console.error("Postal Pincode API lookup error:", err);
          toast.error("Failed to lookup location details from pincode.");
          setCity("");
          setState("");
        } finally {
          setAutofilling(false);
        }
      }
    };

    autoFillLocation();
  }, [pincode]);

  // Generate DY-XXXXXX orderId format
  const generateOrderId = () => {
    const digits = "0123456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      randomPart += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return `DY-${randomPart}`;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code");
      setCouponSuccess("");
      return;
    }
    setValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal: total }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponSuccess(`Code ${data.code} applied! You saved ₹${data.discountAmount}`);
        toast.success(`Coupon ${data.code} applied!`);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid coupon code");
        toast.error(data.error || "Failed to apply coupon");
      }
    } catch (err) {
      console.error(err);
      setCouponError("Failed to validate coupon");
      toast.error("Error validating coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponSuccess("");
    setCouponError("");
    toast.success("Coupon removed");
  };

  // Form Valdiations
  const validateForm = () => {
    console.log(`[Checkout Validation] Starting form validation. Cart items:`, cartItems);
    const newErrors: Record<string, string> = {};

    if (cartItems.length === 0) {
      console.warn(`[Checkout Validation] Blocked: Cart items list is empty.`);
      toast.error("Your cart is empty. Checkout is blocked.");
      return false;
    }

    const sizeMissing = cartItems.some(
      (item) => !item.selectedSize || item.selectedSize.trim() === ""
    );
    if (sizeMissing) {
      console.warn(`[Checkout Validation] Blocked: selectedSize is missing for one or more items:`, cartItems);
      toast.error("Selected size is missing for one or more items. Select a size before checkout.");
      return false;
    }

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

    if (!addressLine1.trim()) newErrors.addressLine1 = "Address Line 1 is required";

    const cleanPin = pincode.replace(/[^0-9]/g, "");
    if (!cleanPin) {
      newErrors.pincode = "Pincode is required";
    } else if (cleanPin.length !== 6) {
      newErrors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.warn(`[Checkout Validation] Blocked: Validation errors found:`, newErrors);
      toast.error("Please fill in all required fields correctly.");
      return false;
    }

    console.log(`[Checkout Validation] Validation passed successfully:`, {
      firstName, lastName, phone, email, pincode, city, state, paymentMethod
    });
    return true;
  };

  // Handle Checkout submission
  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    const subtotal = total;
    const deliveryCharge = subtotal >= 999 ? 0 : 99;
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalTotal = Math.max(0, subtotal - discount + deliveryCharge);

    setSubmitting(true);
    const orderId = generateOrderId();

    try {
      // 1. Cash on Delivery Flow
      if (paymentMethod === "COD") {
        const orderData = {
          orderId,
          userDetails: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.replace(/[^0-9]/g, ""),
            email: email.trim(),
            address1: addressLine1.trim(),
            address2: addressLine2.trim() || "",
            pincode: pincode.replace(/[^0-9]/g, ""),
            city: city.trim(),
            state: state.trim(),
            landmark: landmark.trim() || "",
            notes: notes.trim() || "",
          },
          items: cartItems,
          subtotal,
          deliveryCharge,
          couponCode: appliedCoupon ? appliedCoupon.code : "",
          couponType: appliedCoupon ? appliedCoupon.type : "",
          couponDiscount: discount,
          totalAmount: finalTotal,
          paymentMethod: "COD" as const,
          paymentStatus: "Pending" as const,
          orderStatus: "Pending" as const,
        };

        console.log("ORDER PAYLOAD", orderData);

        const createdId = await createOrder(orderData);

        // Clear cart
        clearCart();
        localStorage.removeItem("cart");

        // Send email in background
        try {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: createdId, action: "placed" }),
          });
        } catch (mailErr) {
          console.error("Mail trigger error:", mailErr);
        }

        toast.success("✓ COD Order Placed Successfully");
        router.push(`/order-success?orderNumber=${createdId}`);
        return;
      }

      // 2. Online Cashfree Checkout Flow
      console.log(`[Cashfree Flow] Initiating order session creation on server for subtotal: ${subtotal}, delivery: ${deliveryCharge}, discount: ${discount}, finalTotal: ${finalTotal}`);
      
      const orderData = {
        orderId,
        userDetails: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.replace(/[^0-9]/g, ""),
          email: email.trim(),
          address1: addressLine1.trim(),
          address2: addressLine2.trim() || "",
          pincode: pincode.replace(/[^0-9]/g, ""),
          city: city.trim(),
          state: state.trim(),
          landmark: landmark.trim() || "",
          notes: notes.trim() || "",
        },
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
          selectedSize: item.selectedSize,
          quantity: item.quantity,
        })),
        subtotal,
        deliveryCharge,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        couponType: appliedCoupon ? appliedCoupon.type : "",
        couponDiscount: discount,
        totalAmount: finalTotal,
        paymentMethod: "CASHFREE",
      };

      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderData }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const serverError = errorData?.error || "Failed to contact Cashfree server";
        throw new Error(serverError);
      }

      const sessionData = await res.json();
      console.log("[Cashfree Flow] Session created successfully on server:", sessionData);

      if (!window || !(window as any).Cashfree) {
        throw new Error("Cashfree SDK failed to load dynamically. Please try again.");
      }

      const cashfree = (window as any).Cashfree({
        mode: sessionData.environment === "production" ? "production" : "sandbox",
      });

      console.log("[Cashfree Flow] Invoking checkout session redirection...");
      cashfree.checkout({
        paymentSessionId: sessionData.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err: any) {
      console.error("Payment initiation / COD placement error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans max-w-5xl mx-auto">


      <h1 className="text-4xl font-black mb-10 tracking-tight text-[#111111]">
        Checkout
      </h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Billing Shipping Address Form */}
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
                  errors.firstName ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.firstName && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.firstName}</span>}
            </div>
            <div>
              <input
                placeholder="Last Name *"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.lastName ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.lastName && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.lastName}</span>}
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
                  errors.phone ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.phone && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.phone}</span>}
            </div>
            <div>
              <input
                placeholder="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.email ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.email && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.email}</span>}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <input
              placeholder="Address Line 1 (Flat, House no., Building, Street) *"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                errors.addressLine1 ? "border-red-500" : "border-neutral-300"
              }`}
            />
            {errors.addressLine1 && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.addressLine1}</span>}
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
              {errors.pincode && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.pincode}</span>}
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
                  errors.city ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.city && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.city}</span>}
            </div>
            <div>
              <input
                placeholder="State *"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`w-full p-4 bg-white border rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition ${
                  errors.state ? "border-red-500" : "border-neutral-300"
                }`}
              />
              {errors.state && <span className="text-red-500 text-[10px] block mt-1 ml-1">{errors.state}</span>}
            </div>
          </div>

          {/* Country (India, Readonly) */}
          <input
            value={country}
            disabled
            className="w-full p-4 bg-neutral-100 border border-neutral-300 rounded-xl outline-none text-sm text-neutral-500 transition cursor-not-allowed"
          />

          {/* Delivery Notes */}
          <div>
            <textarea
              placeholder="Delivery Notes (e.g. gate code, leave with neighbor, bulk instructions) (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-sm text-[#111111] transition h-24 resize-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-3">
              Payment Method
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASHFREE")}
                className={
                  paymentMethod === "CASHFREE"
                    ? "bg-[#38BDF8] text-black px-5 py-2.5 rounded-xl font-bold border border-[#38BDF8] cursor-pointer text-sm shadow-sm"
                    : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition cursor-pointer text-sm"
                }
              >
                Pay Online (UPI/Card)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={
                  paymentMethod === "COD"
                    ? "bg-[#38BDF8] text-black px-5 py-2.5 rounded-xl font-bold border border-[#38BDF8] cursor-pointer text-sm shadow-sm"
                    : "bg-[#f8f8f8] text-[#666666] border border-neutral-200 px-5 py-2.5 rounded-xl hover:text-[#38BDF8] hover:border-[#38BDF8]/40 transition cursor-pointer text-sm"
                }
              >
                COD (Cash on Delivery)
              </button>
            </div>
          </div>
        </div>

        {/* Order Review panel */}
        <div className="bg-[#f8f8f8] border border-neutral-200 p-6 rounded-2xl h-max sticky top-5">
          <h3 className="text-lg font-bold text-[#111111] mb-6">Order Review</h3>

          {loadingCart ? (
            <div className="py-10 text-center text-neutral-400">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400 mb-2"></div>
              <p className="text-xs">Resolving product catalog details...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl mb-6">
              Your cart is empty.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                      />
                    )}
                    <div>
                      <span className="text-sm font-semibold text-[#111111] block leading-tight">{item.name}</span>
                      <span className="text-[11px] text-neutral-500">Qty: {item.quantity}</span>
                      {item.selectedSize && (
                        <span className="bg-neutral-200 text-neutral-800 text-[9px] font-bold px-1.5 py-0.5 rounded ml-2">
                          Size: {formatSize(item.selectedSize)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[#111111] font-bold text-sm">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Coupon Input Block */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-200 pt-4 mt-4 space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                Have a Coupon Code?
              </label>
              
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    placeholder="ENTER CODE"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-xs font-semibold uppercase text-neutral-800"
                    disabled={validatingCoupon}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="bg-[#111111] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#38BDF8] hover:text-black transition cursor-pointer disabled:opacity-50 select-none"
                  >
                    {validatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-sky-50 border border-[#38BDF8]/40 p-2.5 rounded-xl text-xs">
                  <div className="flex flex-col text-left">
                    <span className="font-black text-[#111111] tracking-wide text-xs">
                      🎫 {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] text-sky-800 font-semibold mt-0.5 animate-pulse">
                      Applied successfully
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700 p-1 font-bold text-xs select-none cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Status messages */}
              {couponError && (
                <p className="text-[10px] font-bold text-red-500 mt-1 pl-1">
                  ✕ {couponError}
                </p>
              )}
              {couponSuccess && (
                <p className="text-[10px] font-bold text-[#38BDF8] mt-1 pl-1">
                  ✓ {couponSuccess}
                </p>
              )}
            </div>
          )}

          {/* Totals Breakdown */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-200 pt-4 mt-4 space-y-2 text-sm font-semibold text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[#38BDF8]">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{total >= 999 ? <span className="text-[#38BDF8] font-bold">FREE</span> : `₹99`}</span>
              </div>
            </div>
          )}

          <div className="border-t border-neutral-200 pt-4 mt-2 text-xl font-black text-[#111111] flex justify-between">
            <span>Final Total:</span>
            <span>₹{Math.max(0, total - (appliedCoupon ? appliedCoupon.discountAmount : 0) + (total >= 999 ? 0 : 99))}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || loadingCart || cartItems.length === 0}
            className={`w-full mt-6 py-4 rounded-xl font-bold transition shadow-md text-sm text-center flex items-center justify-center gap-2 ${
              submitting || loadingCart || cartItems.length === 0
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                : "bg-[#38BDF8] text-black hover:bg-[#0ea5e9] hover:text-white cursor-pointer"
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Processing Order...
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <section className="border-t border-neutral-200 bg-white py-12 px-6 mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm6.45 6.45a2.886 2.886 0 0 0 0 4.1M13.75 12h.008v.008h-.008V12Zm0 2.25h.008v.008h-.008v-.008ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0-9a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide">
              ✓ Cash on Delivery Available
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-.447-.266-.852-.676-1.03l-2.456-1.07A1.125 1.125 0 0 0 14.25 9.75h-2.25V4.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h1.5"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide">
              ✓ Fast Shipping Across India
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide">
              ✓ 100% Secure Payments
            </span>
          </div>

          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="text-[#38BDF8] shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"></path>
              </svg>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-wide">
              ✓ Easy Returns & Support
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center p-6 font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-[#666666] text-sm">Loading Checkout...</p>
        </div>
      </main>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}