import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { orderData, paymentId } = await req.json();

    if (!orderData || !orderData.orderId || !orderData.userDetails || !orderData.items) {
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
    } = orderData;

    // 1. Locate coupon document ID beforehand if a coupon is provided
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

    // 2. Execute order validation and write inside an atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      // A. Verify item catalog prices and calculate subtotal
      let computedSubtotal = 0;
      const verifiedItemsList = [];
      const verifiedProductsMap: Record<string, any> = {};

      for (const item of items) {
        const prodRef = doc(db, "products", item.productId);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
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
        const couponRef = doc(db, "coupons", couponDocId);
        const couponSnap = await transaction.get(couponRef);

        if (!couponSnap.exists()) {
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
          usedCount: increment(1),
        });
      }

      // D. Calculate grand total amount
      const computedTotal = computedSubtotal - finalDiscount + computedDelivery;

      // E. Generate schemas and save order document
      const fullName = `${userDetails.firstName} ${userDetails.lastName}`.trim();
      const fullAddress = `${userDetails.address1}${
        userDetails.address2 ? ", " + userDetails.address2 : ""
      }${userDetails.landmark ? " (Landmark: " + userDetails.landmark + ")" : ""}`.trim();

      const legacyProducts = verifiedItemsList.map((item) => ({
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
        createdAt: serverTimestamp(),

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
        paymentId: paymentId || null,
        status: "pending",
      };

      const orderRef = doc(db, "orders", orderId);
      transaction.set(orderRef, orderPayload);

      return { orderId };
    });

    return NextResponse.json({ success: true, orderId: result.orderId });

  } catch (err: any) {
    console.error("Secure place-order transaction failed:", err);
    return NextResponse.json({ error: err.message || "Failed to process and record order" }, { status: 500 });
  }
}
