import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    console.log(`[Razorpay Order API] Initiating order creation on server for amount: ${amount} INR`);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[Razorpay API] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables.");
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paisa securely
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    console.log("[Razorpay Order API] Order created successfully on Razorpay server:", order);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err: any) {
    console.error("[Razorpay Order API] Error during order creation:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}