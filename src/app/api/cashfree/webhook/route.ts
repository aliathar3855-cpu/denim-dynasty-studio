import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, FieldValue } from "@/firebase/admin";

export async function POST(req: Request) {
  try {
    const timestamp = req.headers.get("x-webhook-timestamp");
    const signature = req.headers.get("x-webhook-signature");

    if (!timestamp || !signature) {
      console.error("[Cashfree Webhook] Verification failed: Missing headers.");
      return NextResponse.json({ error: "Missing verification headers" }, { status: 400 });
    }

    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error("[Cashfree Webhook] CASHFREE_SECRET_KEY is not configured on the server. Audit details:", {
        hasSecretKey: false,
        cashfreeEnv: process.env.CASHFREE_ENV || "not_set",
      });
      return NextResponse.json({ error: "Server credentials missing" }, { status: 500 });
    }

    // 1. Get raw request body as string
    const rawBody = await req.text();
    console.log("[Cashfree Webhook] Received raw body payload.");

    // 2. Cryptographic verification of signature
    const dataString = timestamp + rawBody;
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(dataString)
      .digest("base64");

    if (generatedSignature !== signature) {
      console.error("[Cashfree Webhook] Webhook signature mismatch!");
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }

    console.log("[Cashfree Webhook] Signature verified successfully!");

    // 3. Parse payload and handle events
    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const eventData = payload.data;

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "ORDER_PAID") {
      const orderId = eventData?.order?.order_id;
      const paymentStatus = eventData?.payment?.payment_status;
      const cfPaymentId = eventData?.payment?.cf_payment_id || "";
      const paymentGroup = eventData?.payment?.payment_group || "Online";

      console.log(`[Cashfree Webhook] Success payment notification received for Order ID: ${orderId}, Status: ${paymentStatus}`);

      if (orderId && paymentStatus === "SUCCESS") {
        const orderRef = adminDb.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (orderSnap.exists) {
          const orderData = orderSnap.data();

          if (orderData && orderData.paymentStatus !== "PAID") {
            await adminDb.runTransaction(async (transaction: any) => {
              transaction.update(orderRef, {
                paymentStatus: "PAID",
                status: "paid", // legacy compatibility
                paymentId: cfPaymentId || null,
                paymentMethodDetails: paymentGroup || "Online",
                statusHistory: FieldValue.arrayUnion({
                  status: "Confirmed",
                  timestamp: new Date(),
                  note: "Payment successfully verified via Webhook notification."
                })
              });
            });
            console.log(`[Cashfree Webhook] Order successfully updated to PAID in Firestore: ${orderId}`);
          } else {
            console.log(`[Cashfree Webhook] Order ${orderId} is already marked PAID. Skipping.`);
          }
        } else {
          console.warn(`[Cashfree Webhook] Order ${orderId} was not found in Firestore.`);
        }
      }
    } else {
      console.log(`[Cashfree Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });

  } catch (err: any) {
    console.error("[Cashfree Webhook] Exception while handling webhook:", err);
    return NextResponse.json({ error: err.message || "Failed to process webhook" }, { status: 500 });
  }
}
