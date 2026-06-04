import { db } from "@/firebase/config";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  selectedSize: string;
  quantity: number;
}

export interface UserDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address1: string;
  address2?: string;
  pincode: string;
  city: string;
  state: string;
  landmark?: string;
  notes?: string;
}

export interface OrderData {
  orderId: string;
  userDetails: UserDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string;
  couponType?: string;
  couponDiscount?: number;
  totalAmount: number;
  paymentMethod: "COD" | "RAZORPAY" | "ONLINE";
  paymentStatus: "Pending" | "Paid" | "PAID";
  orderStatus: "Pending";
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

/**
 * Recursively sanitizes a payload object by replacing all undefined values with empty strings ("").
 * It preserves special Firestore types like FieldValue (serverTimestamp) and Timestamp.
 */
export const sanitizePayload = (obj: any): any => {
  if (obj === undefined) {
    return "";
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizePayload(item));
  }
  if (typeof obj === "object") {
    // Check if it is a plain object or a special Firestore type
    const proto = Object.getPrototypeOf(obj);
    if (proto === null || proto === Object.prototype) {
      const result: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        result[key] = sanitizePayload(obj[key]);
      }
      return result;
    }
  }
  return obj;
};

/**
 * Saves a new order to the "orders" collection in Firestore.
 * Supports both the new structured schema and the legacy schema for total backward compatibility.
 * 
 * @param orderData The new order schema details
 * @param paymentId Optional transaction/payment reference id (from Razorpay)
 * @returns The unique order ID
 */
export const createOrder = async (orderData: OrderData, paymentId?: string): Promise<string> => {
  console.log("ORDER PAYLOAD (sent to server-side validate/save):", orderData);

  try {
    const response = await fetch("/api/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderData, paymentId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to validate and save order on the server.");
    }

    console.log(`[Firestore Order Save] Order successfully created on server. ID: "${result.orderId}"`);
    return result.orderId;
  } catch (err: any) {
    console.error(`[Firestore Order Save] Error routing order to server API:`, err);
    throw err;
  }
};

