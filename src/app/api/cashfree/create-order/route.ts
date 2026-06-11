import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  runTransaction,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const getCashfreeUrl = (path: string) => {
  const isProd = process.env.CASHFREE_ENV === "production";
  const baseUrl = isProd
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
  return `${baseUrl}${path}`;
};

export async function POST(req: Request) {
  try {
    const { orderData } = await req.json();

    if (!orderData || !orderData.orderId || !orderData.userDetails || !orderData.items) {
      console.error("[Cashfree Create Order API] Missing parameters:", orderData);
      return NextResponse.json({ error: "Missing required order parameters" }, { status: 400 });
    }

    const {
      orderId,
      userDetails,
      items,
      couponCode,
    } = orderData;

    console.log(`[Cashfree Create Order API] Initiating checkout for order: ${orderId}, amount: ${orderData.totalAmount}`);

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error("[Cashfree API] Missing Cashfree Credentials in environment variables. Audit details:", {
        hasAppId: !!process.env.CASHFREE_APP_ID,
        appIdLength: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.length : 0,
        hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
        secretKeyLength: process.env.CASHFREE_SECRET_KEY ? process.env.CASHFREE_SECRET_KEY.length : 0,
        cashfreeEnv: process.env.CASHFREE_ENV || "not_set",
      });
      return NextResponse.json(
        { 
          error: "Cashfree integration is not configured on the server.",
          details: {
            hasAppId: !!process.env.CASHFREE_APP_ID,
            hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
            cashfreeEnv: process.env.CASHFREE_ENV || "not_set",
          }
        },
        { status: 500 }
      );
    }

    // 1. Resolve host and protocol for redirect URLs, preferring NEXT_PUBLIC_SITE_URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const isProduction = process.env.CASHFREE_ENV === "production";
    let origin = siteUrl || "";

    if (!origin) {
      if (isProduction) {
        console.error("[Cashfree API] NEXT_PUBLIC_SITE_URL is not configured in production mode.");
        return NextResponse.json(
          { 
            error: "Server configuration error: NEXT_PUBLIC_SITE_URL environment variable is missing.",
            details: { environment: "production" }
          },
          { status: 500 }
        );
      }
      const host = req.headers.get("host") || "";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      origin = host ? `${proto}://${host}` : "";
    }
    origin = origin.replace(/\/$/, "");

    // Validate protocol constraints for Cashfree Production env
    if (isProduction) {
      if (!origin.startsWith("https://")) {
        console.error("[Cashfree API] Insecure return/notify origin configured for Production mode:", origin);
        return NextResponse.json(
          { 
            error: "Insecure URL configuration. Cashfree Production requires HTTPS.",
            details: { origin, environment: "production" }
          },
          { status: 400 }
        );
      }
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        console.error("[Cashfree API] Invalid domain configured for Cashfree Production mode:", origin);
        return NextResponse.json(
          { 
            error: "Invalid URL configuration. Cashfree Production does not support localhost.",
            details: { origin, environment: "production" }
          },
          { status: 400 }
        );
      }
    }

    // 2. Locate coupon document if applicable
    let couponDocId: string | null = null;
    let couponCodeClean = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      couponCodeClean = couponCode.trim().toUpperCase();
      const couponsRef = collection(db, "coupons");
      const q = query(couponsRef, where("code", "==", couponCodeClean));
      const snap = await getDocs(q);
      if (snap.empty) {
        return NextResponse.json({ error: "Coupon code does not exist" }, { status: 400 });
      }
      couponDocId = snap.docs[0].id;
    }

    // 3. Server-side validation of prices, delivery, and coupons in transaction
    const validationResult = await runTransaction(db, async (transaction) => {
      let computedSubtotal = 0;
      const verifiedItemsList = [];

      for (const item of items) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error(`Product with ID ${item.productId} not found in database catalog`);
        }

        const prodData = prodSnap.data();
        const price = Number(prodData.price);
        computedSubtotal += price * Number(item.quantity || 1);

        verifiedItemsList.push({
          productId: item.productId,
          name: prodData.name,
          price,
          image: prodData.images?.[0] || item.image || "",
          selectedSize: item.selectedSize || "",
          quantity: Number(item.quantity || 1),
        });
      }

      const FREE_SHIPPING_THRESHOLD = 999;
      const DELIVERY_FEE = 99;
      const computedDelivery = computedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;

      let finalDiscount = 0;
      let couponType = "";

      if (couponDocId) {
        const couponRef = doc(db, "coupons", couponDocId);
        const couponSnap = await transaction.get(couponRef);

        if (!couponSnap.exists()) {
          throw new Error("Coupon data could not be retrieved inside transaction");
        }

        const couponData = couponSnap.data();

        if (!couponData.active) {
          throw new Error("Coupon is not active");
        }

        const nowSec = Timestamp.now().seconds;
        if (couponData.validFrom && nowSec < couponData.validFrom.seconds) {
          throw new Error("Coupon is not active yet");
        }
        if (couponData.validUntil && nowSec > couponData.validUntil.seconds) {
          throw new Error("Coupon has expired");
        }

        const usedCount = Number(couponData.usedCount || 0);
        const usageLimit = Number(couponData.usageLimit || 0);
        if (usageLimit > 0 && usedCount >= usageLimit) {
          throw new Error("Coupon usage limit reached");
        }

        const minOrderValue = Number(couponData.minOrderValue || 0);
        if (computedSubtotal < minOrderValue) {
          throw new Error(`Minimum order of ₹${minOrderValue} required for this coupon`);
        }

        const discountValue = Number(couponData.discountValue || 0);
        const maxDiscountAmount = Number(couponData.maxDiscountAmount || 0);
        couponType = couponData.type;

        if (couponType === "percentage") {
          finalDiscount = Math.round((computedSubtotal * discountValue) / 100);
          if (maxDiscountAmount > 0 && finalDiscount > maxDiscountAmount) {
            finalDiscount = maxDiscountAmount;
          }
        } else if (couponType === "fixed") {
          finalDiscount = Math.min(discountValue, computedSubtotal);
        } else {
          throw new Error("Unsupported coupon discount type configuration");
        }

        // Increment coupon count inside the transaction
        transaction.update(couponRef, {
          usedCount: increment(1),
        });
      }

      const computedTotal = computedSubtotal - finalDiscount + computedDelivery;

      return {
        subtotal: computedSubtotal,
        deliveryCharge: computedDelivery,
        couponDiscount: finalDiscount,
        couponType,
        totalAmount: computedTotal,
        items: verifiedItemsList,
      };
    });

    // 4. Create order session in Cashfree
    const cashfreeEndpoint = getCashfreeUrl("/pg/orders");
    const fullName = `${userDetails.firstName} ${userDetails.lastName}`.trim();
    const fullAddress = `${userDetails.address1}${
      userDetails.address2 ? ", " + userDetails.address2 : ""
    }${userDetails.landmark ? " (Landmark: " + userDetails.landmark + ")" : ""}`.trim();

    const cashfreeBody = {
      order_id: orderId,
      order_amount: Number(validationResult.totalAmount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${userDetails.phone.replace(/[^0-9]/g, "")}_${Date.now()}`,
        customer_phone: userDetails.phone.replace(/[^0-9]/g, "").slice(-10),
        customer_email: userDetails.email,
        customer_name: fullName,
      },
      order_meta: {
        return_url: `${origin}/api/cashfree/verify-payment?order_id=${orderId}`,
        notify_url: `${origin}/api/cashfree/webhook`,
      },
    };

    console.log("[Cashfree Create PG Order] Sending payload to Cashfree PG:", cashfreeBody);

    const cashfreeResponse = await fetch(cashfreeEndpoint, {
      method: "POST",
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cashfreeBody),
    });

    const cashfreeResult = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("[Cashfree API Error] Order creation failed:", cashfreeResult);
      return NextResponse.json(
        { error: cashfreeResult.message || "Failed to initiate transaction with Cashfree." },
        { status: 400 }
      );
    }

    console.log("[Cashfree API Success] Cashfree order response:", cashfreeResult);

    const paymentSessionId = cashfreeResult.payment_session_id;

    if (!paymentSessionId) {
      console.error("[Cashfree API Error] payment_session_id was not returned.");
      return NextResponse.json({ error: "Cashfree did not return a session identifier" }, { status: 500 });
    }

    // 5. Write Pending Order payload to Firestore
    const legacyProducts = validationResult.items.map((item) => ({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.image,
      selectedSize: item.selectedSize,
      quantity: item.quantity,
    }));

    const orderPayload = {
      // Structured Schema
      orderId,
      userDetails,
      items: validationResult.items,
      subtotal: validationResult.subtotal,
      deliveryCharge: validationResult.deliveryCharge,
      couponCode: couponCodeClean || "",
      couponType: validationResult.couponType || "",
      couponDiscount: validationResult.couponDiscount,
      totalAmount: validationResult.totalAmount,
      paymentMethod: "CASHFREE",
      paymentStatus: "Pending",
      orderStatus: "Pending",
      paymentSessionId,
      cfOrderId: cashfreeResult.cf_order_id || "",
      createdAt: serverTimestamp(),
      statusHistory: [
        {
          status: "Pending",
          timestamp: new Date(),
        }
      ],

      // Legacy Schema Compatibility
      orderNumber: orderId,
      customer: {
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        name: fullName,
        email: userDetails.email,
        phone: userDetails.phone,
        addressLine1: userDetails.address1,
        addressLine2: userDetails.address2 || "",
        landmark: userDetails.landmark || "",
        address: fullAddress,
        pincode: userDetails.pincode,
        city: userDetails.city,
        state: userDetails.state,
        country: "India",
        notes: userDetails.notes || "",
      },
      products: legacyProducts,
      total: validationResult.totalAmount,
      paymentId: null,
      status: "pending",
    };

    const orderRef = doc(db, "orders", orderId);
    await runTransaction(db, async (transaction) => {
      transaction.set(orderRef, orderPayload);
    });

    console.log(`[Cashfree Create Order API] Stored Pending order document: ${orderId}`);

    return NextResponse.json({
      success: true,
      payment_session_id: paymentSessionId,
      order_id: orderId,
      environment: process.env.CASHFREE_ENV || "sandbox",
    });

  } catch (err: any) {
    console.error("[Cashfree Create Order API] Global Exception:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process online checkout session." },
      { status: 500 }
    );
  }
}
