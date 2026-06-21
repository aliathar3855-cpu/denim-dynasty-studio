import { NextResponse } from "next/server";
import { adminDb, Timestamp } from "@/firebase/admin";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "Invalid coupon code format" }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection("coupons")
      .where("code", "==", code.trim().toUpperCase())
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ valid: false, error: "Coupon code does not exist" });
    }

    const couponDoc = snapshot.docs[0];
    const couponData = couponDoc.data();
    
    // 1. Check Active Status
    if (!couponData.active) {
      return NextResponse.json({ valid: false, error: "Coupon is not active" });
    }

    // 2. Check Expiration Timeline
    const now = Timestamp.now();
    
    if (couponData.validFrom) {
      const validFrom = couponData.validFrom;
      if (now.seconds < validFrom.seconds) {
        return NextResponse.json({ valid: false, error: "Coupon is not active yet" });
      }
    }

    if (couponData.validUntil) {
      const validUntil = couponData.validUntil;
      if (now.seconds > validUntil.seconds) {
        return NextResponse.json({ valid: false, error: "Coupon has expired" });
      }
    }

    // 3. Check Usage Limits
    const usedCount = Number(couponData.usedCount || 0);
    const usageLimit = Number(couponData.usageLimit || 0);
    if (usageLimit > 0 && usedCount >= usageLimit) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }

    // 4. Check Minimum Order Value
    const minOrderValue = Number(couponData.minOrderValue || 0);
    if (subtotal < minOrderValue) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order of ₹${minOrderValue} required` 
      });
    }

    // 5. Calculate Discount
    let discountAmount = 0;
    const discountValue = Number(couponData.discountValue || 0);
    const maxDiscountAmount = Number(couponData.maxDiscountAmount || 0);

    if (couponData.type === "percentage") {
      discountAmount = Math.round((subtotal * discountValue) / 100);
      if (maxDiscountAmount > 0 && discountAmount > maxDiscountAmount) {
        discountAmount = maxDiscountAmount;
      }
    } else if (couponData.type === "fixed") {
      discountAmount = Math.min(discountValue, subtotal);
    } else {
      return NextResponse.json({ valid: false, error: "Invalid coupon discount type configuration" });
    }

    return NextResponse.json({
      valid: true,
      code: couponData.code,
      type: couponData.type,
      discountValue,
      maxDiscountAmount,
      discountAmount,
    });

  } catch (err: any) {
    console.error("Server coupon validation error:", err);
    return NextResponse.json({ valid: false, error: "Internal server error during validation" }, { status: 500 });
  }
}
