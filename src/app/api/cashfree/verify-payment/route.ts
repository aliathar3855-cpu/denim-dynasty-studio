import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import { doc, getDoc, runTransaction, arrayUnion } from "firebase/firestore";

const getCashfreeUrl = (path: string) => {
  const isProd = process.env.CASHFREE_ENV === "production";
  const baseUrl = isProd
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";
  return `${baseUrl}${path}`;
};

export async function GET(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      console.error("[Cashfree Verify Payment] Missing order_id query parameter.");
      return NextResponse.redirect(`${origin}/checkout?error=missing_order_id`);
    }

    console.log(`[Cashfree Verify Payment] Verifying status for order: ${orderId}`);

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error("[Cashfree API - Verify Payment] Missing Cashfree Credentials in environment variables. Audit details:", {
        hasAppId: !!process.env.CASHFREE_APP_ID,
        appIdLength: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.length : 0,
        hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
        secretKeyLength: process.env.CASHFREE_SECRET_KEY ? process.env.CASHFREE_SECRET_KEY.length : 0,
        cashfreeEnv: process.env.CASHFREE_ENV || "not_set",
      });
      return NextResponse.redirect(`${origin}/checkout?error=credentials_missing`);
    }

    // 1. Fetch order details from Cashfree
    const cashfreeOrderUrl = getCashfreeUrl(`/pg/orders/${orderId}`);
    const orderResponse = await fetch(cashfreeOrderUrl, {
      method: "GET",
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!orderResponse.ok) {
      const errText = await orderResponse.text();
      console.error(`[Cashfree Verify Payment] Failed to fetch order details from Cashfree: ${errText}`);
      return NextResponse.redirect(`${origin}/checkout?error=verification_failed`);
    }

    const cashfreeOrder = await orderResponse.json();
    console.log(`[Cashfree Verify Payment] Cashfree order status: ${cashfreeOrder.order_status}`);

    const isPaid = cashfreeOrder.order_status === "PAID";

    // 2. Fetch payments list to get payment details (txn reference, mode)
    let paymentId = "";
    let paymentMethodDetails = "";

    try {
      const cashfreePaymentsUrl = getCashfreeUrl(`/pg/orders/${orderId}/payments`);
      const paymentsResponse = await fetch(cashfreePaymentsUrl, {
        method: "GET",
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      });

      if (paymentsResponse.ok) {
        const paymentsList = await paymentsResponse.json();
        if (Array.isArray(paymentsList) && paymentsList.length > 0) {
          // Find the successful payment attempt
          const successPayment = paymentsList.find((p: any) => p.payment_status === "SUCCESS") || paymentsList[0];
          paymentId = successPayment.cf_payment_id || "";
          paymentMethodDetails = successPayment.payment_group || "";
        }
      }
    } catch (payErr) {
      console.error("[Cashfree Verify Payment] Error fetching payments log list:", payErr);
    }

    // 3. Update order document status in Firestore
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.error(`[Cashfree Verify Payment] Order document not found in Firestore: ${orderId}`);
      return NextResponse.redirect(`${origin}/checkout?error=order_not_found`);
    }

    const currentOrderData = orderSnap.data();

    if (isPaid) {
      // Avoid double-processing if already marked PAID (e.g. by webhook)
      if (currentOrderData.paymentStatus !== "PAID") {
        await runTransaction(db, async (transaction) => {
          transaction.update(orderRef, {
            paymentStatus: "PAID",
            status: "paid", // legacy compatibility
            paymentId: paymentId || null,
            paymentMethodDetails: paymentMethodDetails || "Online",
            statusHistory: arrayUnion({
              status: "Confirmed",
              timestamp: new Date(),
              note: "Payment successfully verified."
            })
          });
        });
        console.log(`[Cashfree Verify Payment] Order updated to PAID: ${orderId}`);
      }

      // Redirect client to success page
      return NextResponse.redirect(`${origin}/order-success?orderNumber=${orderId}`);
    } else {
      // Payment failed or is in pending status
      await runTransaction(db, async (transaction) => {
        transaction.update(orderRef, {
          paymentStatus: "FAILED",
          status: "failed", // legacy compatibility
        });
      });
      console.warn(`[Cashfree Verify Payment] Transaction failed for order: ${orderId}. Status: ${cashfreeOrder.order_status}`);
      return NextResponse.redirect(`${origin}/checkout?error=payment_failed`);
    }

  } catch (err: any) {
    console.error("[Cashfree Verify Payment] Global Exception:", err);
    return NextResponse.redirect(`${origin}/checkout?error=server_error`);
  }
}
