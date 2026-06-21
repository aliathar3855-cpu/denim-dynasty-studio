import { NextResponse } from "next/server";
import { adminDb, FieldValue, Timestamp } from "@/firebase/admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { orderData, paymentId } = await req.json();
    console.log("[Place Order API] Received order save request on server:", {
      orderId: orderData?.orderId,
      paymentMethod: orderData?.paymentMethod,
      paymentStatus: orderData?.paymentStatus,
      paymentId
    });

    if (!orderData || !orderData.orderId || !orderData.userDetails || !orderData.items) {
      console.error("[Place Order API] Missing order parameters:", orderData);
      return NextResponse.json({ error: "Missing required order parameters" }, { status: 400 });
    }

    const {
      orderId,
      userDetails,
      items,
      paymentMethod,
      paymentStatus,
      orderStatus,
      couponCode,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = orderData;

    // Cryptographic signature verification for online payments
    if (paymentMethod === "ONLINE" || paymentMethod === "RAZORPAY") {
      const activePaymentId = razorpayPaymentId || paymentId;
      const activeOrderId = razorpayOrderId;
      const activeSignature = razorpaySignature || orderData.razorpaySignature;

      console.log(`[Razorpay Verification] Verifying payment details: paymentId=${activePaymentId}, orderId=${activeOrderId}, signature=${activeSignature}`);

      if (!activePaymentId || !activeOrderId || !activeSignature) {
        console.error("[Razorpay Verification] Verification failed: Missing payment credentials.");
        return NextResponse.json({ 
          error: `Verification failed: Missing required Razorpay details. paymentId=${activePaymentId || "missing"}, orderId=${activeOrderId || "missing"}, signature=${activeSignature || "missing"}` 
        }, { status: 400 });
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("[Razorpay Verification] RAZORPAY_KEY_SECRET is not configured on the server.");
        return NextResponse.json({ error: "Razorpay integration is not configured on the server." }, { status: 500 });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(activeOrderId + "|" + activePaymentId)
        .digest("hex");

      if (generatedSignature !== activeSignature) {
        console.error(`[Razorpay Verification] Signature mismatch! Generated: "${generatedSignature}", Received: "${activeSignature}"`);
        return NextResponse.json({ error: "Razorpay payment signature verification failed. Mismatched signature." }, { status: 400 });
      }

      console.log("[Razorpay Verification] Payment signature verified successfully!");
    }

    // 1. Locate coupon document ID beforehand if a coupon is provided
    let couponDocId: string | null = null;
    let couponCodeClean = "";
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      couponCodeClean = couponCode.trim().toUpperCase();
      const snap = await adminDb
        .collection("coupons")
        .where("code", "==", couponCodeClean)
        .get();
      if (snap.empty) {
        return NextResponse.json({ error: "Coupon code does not exist" }, { status: 400 });
      }
      couponDocId = snap.docs[0].id;
    }

    // 2. Execute order validation and write inside an atomic transaction
    const result = await adminDb.runTransaction(async (transaction: any) => {
      // A. Verify item catalog prices and calculate subtotal
      let computedSubtotal = 0;
      const verifiedItemsList = [];
      const verifiedProductsMap: Record<string, any> = {};

      for (const item of items) {
        const prodRef = adminDb.collection("products").doc(item.productId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists) {
          throw new Error(`Product with ID ${item.productId} not found in database catalog`);
        }

        const prodData = prodSnap.data();
        const price = Number(prodData.price);
        computedSubtotal += price * Number(item.quantity || 1);
        
        verifiedProductsMap[item.productId] = prodData;
        verifiedItemsList.push({
          productId: item.productId,
          name: prodData.name,
          price,
          image: prodData.images?.[0] || item.image || "",
          selectedSize: item.selectedSize || "",
          quantity: Number(item.quantity || 1),
        });
      }

      // B. Compute Delivery Fee (on subtotal BEFORE coupon deduction)
      const FREE_SHIPPING_THRESHOLD = 999;
      const DELIVERY_FEE = 99;
      const computedDelivery = computedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;

      // C. Validate applied coupon if present
      let finalDiscount = 0;
      let couponType = "";

      if (couponDocId) {
        const couponRef = adminDb.collection("coupons").doc(couponDocId);
        const couponSnap = await transaction.get(couponRef);

        if (!couponSnap.exists) {
          throw new Error("Coupon data could not be retrieved inside transaction");
        }

        const couponData = couponSnap.data();

        // Check active status
        if (!couponData.active) {
          throw new Error("Coupon is not active");
        }

        // Check expiration
        const nowSec = Timestamp.now().seconds;
        if (couponData.validFrom && nowSec < couponData.validFrom.seconds) {
          throw new Error("Coupon is not active yet");
        }
        if (couponData.validUntil && nowSec > couponData.validUntil.seconds) {
          throw new Error("Coupon has expired");
        }

        // Check usage limits
        const usedCount = Number(couponData.usedCount || 0);
        const usageLimit = Number(couponData.usageLimit || 0);
        if (usageLimit > 0 && usedCount >= usageLimit) {
          throw new Error("Coupon usage limit reached");
        }

        // Check minimum subtotal required
        const minOrderValue = Number(couponData.minOrderValue || 0);
        if (computedSubtotal < minOrderValue) {
          throw new Error(`Minimum order of ₹${minOrderValue} required for this coupon`);
        }

        // Calculate coupon discount
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

        // Increment coupon used count
        transaction.update(couponRef, {
          usedCount: FieldValue.increment(1),
        });
      }

      // D. Calculate grand total amount
      const computedTotal = computedSubtotal - finalDiscount + computedDelivery;

      // E. Generate schemas and save order document
      const fullName = `${userDetails.firstName} ${userDetails.lastName}`.trim();
      const fullAddress = `${userDetails.address1}${
        userDetails.address2 ? ", " + userDetails.address2 : ""
      }${userDetails.landmark ? " (Landmark: " + userDetails.landmark + ")" : ""}`.trim();

      const legacyProducts = verifiedItemsList.map((item: any) => ({
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
        items: verifiedItemsList,
        subtotal: computedSubtotal,
        deliveryCharge: computedDelivery,
        couponCode: couponCodeClean || "",
        couponType: couponType || "",
        couponDiscount: finalDiscount,
        totalAmount: computedTotal,
        paymentMethod,
        paymentStatus,
        orderStatus,
        razorpayPaymentId: razorpayPaymentId || paymentId || "",
        razorpayOrderId: razorpayOrderId || "",
        razorpaySignature: razorpaySignature || "",
        createdAt: FieldValue.serverTimestamp(),
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
        total: computedTotal,
        paymentId: paymentId || razorpayPaymentId || null,
        status: (paymentMethod === "ONLINE" || paymentMethod === "RAZORPAY") ? "paid" : "pending",
      };

      const orderRef = adminDb.collection("orders").doc(orderId);
      transaction.set(orderRef, orderPayload);

      return { orderId };
    });

    return NextResponse.json({ success: true, orderId: result.orderId });

  } catch (err: any) {
    console.error("Secure place-order transaction failed:", err);
    return NextResponse.json({ error: err.message || "Failed to process and record order" }, { status: 500 });
  }
}
