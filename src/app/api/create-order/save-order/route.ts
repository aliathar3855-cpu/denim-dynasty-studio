import { NextResponse } from "next/server";
import { db } from "@/firebase/config";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await addDoc(collection(db, "orders"), {
      ...data,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}