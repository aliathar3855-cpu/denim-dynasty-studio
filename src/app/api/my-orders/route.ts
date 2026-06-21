import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Missing or invalid phone parameter" }, { status: 400 });
    }

    const cleanInputPhone = phone.replace(/[^0-9]/g, "");
    if (cleanInputPhone.length < 10) {
      return NextResponse.json({ error: "Phone number must be at least 10 digits" }, { status: 400 });
    }

    const suffix = cleanInputPhone.slice(-10);
    const possiblePhones = [suffix, "91" + suffix];

    // Concurrently fetch orders under both schema definitions (new schema: userDetails.phone, legacy: customer.phone)
    const [snap1, snap2] = await Promise.all([
      adminDb.collection("orders").where("userDetails.phone", "in", possiblePhones).get(),
      adminDb.collection("orders").where("customer.phone", "in", possiblePhones).get()
    ]);

    const matchedOrdersMap = new Map();

    const addOrder = (doc: any) => {
      const data = doc.data();
      const id = doc.id;
      matchedOrdersMap.set(id, {
        id,
        orderNumber: data.orderNumber || data.orderId || id,
        total: Number(data.total || data.totalAmount || 0),
        status: (data.status || data.orderStatus || "pending").toLowerCase(),
        paymentMethod: data.paymentMethod || "COD",
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      });
    };

    snap1.docs.forEach(addOrder);
    snap2.docs.forEach(addOrder);

    // Sort by createdAt descending
    const matchedOrders = Array.from(matchedOrdersMap.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ orders: matchedOrders });
  } catch (err: any) {
    console.error("[My Orders API Error]:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
