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
  totalAmount: number;
  paymentMethod: "COD" | "RAZORPAY";
  paymentStatus: "Pending" | "Paid";
  orderStatus: "Pending";
}

/**
 * Saves a new order to the "orders" collection in Firestore.
 * Supports both the new structured schema and the legacy schema for total backward compatibility.
 * 
 * @param orderData The new order schema details
 * @param paymentId Optional transaction/payment reference id (from Razorpay)
 * @returns The unique order ID
 */
export const createOrder = async (orderData: OrderData, paymentId?: string): Promise<string> => {
  const { orderId, userDetails, items, totalAmount, paymentMethod, paymentStatus, orderStatus } = orderData;

  const fullName = `${userDetails.firstName} ${userDetails.lastName}`.trim();
  const fullAddress = `${userDetails.address1}${
    userDetails.address2 ? ", " + userDetails.address2 : ""
  }${userDetails.landmark ? " (Landmark: " + userDetails.landmark + ")" : ""}`.trim();

  // Legacy products format mapping
  const legacyProducts = items.map((item) => ({
    id: item.productId,
    productId: item.productId,
    name: item.name,
    price: item.price,
    imageUrl: item.image,
    selectedSize: item.selectedSize,
    quantity: item.quantity,
  }));

  const payload = {
    // New Schema
    orderId,
    userDetails,
    items,
    totalAmount,
    paymentMethod,
    paymentStatus,
    orderStatus,
    createdAt: serverTimestamp(),

    // Legacy Schema (maintains compatibility with existing admin/email systems)
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
    total: totalAmount,
    paymentId: paymentId || null,
    status: "pending", // converted orderStatus to lowercase
  };

  console.log(`[Firestore Order Save] Writing order document to database. ID: "${orderId}", Payload:`, payload);
  try {
    const docRef = doc(db, "orders", orderId);
    await setDoc(docRef, payload);
    console.log(`[Firestore Order Save] Order successfully written to Firestore.`);
    return orderId;
  } catch (err: any) {
    console.error(`[Firestore Order Save] Error writing order to Firestore:`, err);
    throw err;
  }
};
