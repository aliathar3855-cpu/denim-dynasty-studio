import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await addDoc(collection(db, "orders"), {
      ...data,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "failed to create order" },
      { status: 500 }
    );
  }
}