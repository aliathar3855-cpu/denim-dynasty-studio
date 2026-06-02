import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export const KIDS_SIZE_CHART: Record<string, string> = {
  "16": "1-2 Years",
  "18": "2-3 Years",
  "20": "3-4 Years",
  "22": "4-5 Years",
  "24": "5-6 Years",
  "26": "6-7 Years",
  "28": "7-8 Years",
  "30": "8-9 Years",
  "32": "9-10 Years",
  "34": "10-11 Years",
  "36": "11-12 Years",
  "38": "12-13 Years",
  "40": "13-14 Years",
};

export const formatSize = (size: string | null | undefined): string => {
  if (!size) return "";
  return KIDS_SIZE_CHART[size] ? `${size} (${KIDS_SIZE_CHART[size]})` : size;
};

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  imageUrl?: string;
  sizeType: "LETTER" | "NUMERIC";
  sizes: string[];
  createdAt?: Timestamp;
}

/**
 * Normalizes a product retrieved from Firestore to ensure backward and forward compatibility
 * between single-image (imageUrl) and multi-image (images) schemas.
 */
const normalizeProduct = (docId: string, data: any): Product => {
  const images = Array.isArray(data.images)
    ? data.images
    : data.imageUrl
    ? [data.imageUrl]
    : [];
  const imageUrl = data.imageUrl || images[0] || "";

  return {
    id: docId,
    name: data.name || "",
    description: data.description || "",
    price: Number(data.price) || 0,
    category: data.category || "",
    images,
    imageUrl,
    sizeType: data.sizeType || "LETTER",
    sizes: data.sizes || [],
    createdAt: data.createdAt,
  };
};

/**
 * Automatically detects product category based on product name keywords.
 */
export const detectCategory = (name: string): string => {
  const nameLower = name.toLowerCase();

  if (nameLower.includes("cord")) {
    return "cord set";
  }
  if (nameLower.includes("tshirt") || nameLower.includes("t-shirt")) {
    return "t-shirt";
  }
  if (nameLower.includes("shirt")) {
    return "shirt";
  }
  if (nameLower.includes("track")) {
    return "track pant";
  }
  if (nameLower.includes("3/4")) {
    return "3/4 pant";
  }
  if (nameLower.includes("pant")) {
    return "pant";
  }

  return "shirt"; // Fallback category
};

/**
 * Fetches all products sorted by creation date.
 */
export const getProducts = async (): Promise<Product[]> => {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => normalizeProduct(doc.id, doc.data()));
};

/**
 * Fetches a single product by its Firestore document ID.
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, "products", id);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return normalizeProduct(snapshot.id, snapshot.data());
  }

  return null;
};

/**
 * Saves a new product to Firestore.
 */
export const addProduct = async (
  productData: Omit<Product, "id" | "createdAt">
): Promise<string> => {
  const productsRef = collection(db, "products");

  // Prevent duplicate names
  const qSnapshot = await getDocs(query(productsRef));
  const exists = qSnapshot.docs.some((docItem) => {
    const data = docItem.data();
    return data.name?.trim().toLowerCase() === productData.name.trim().toLowerCase();
  });

  if (exists) {
    throw new Error("Product with this name already exists.");
  }

  const docRef = await addDoc(productsRef, {
    name: productData.name.trim(),
    description: productData.description?.trim() || "",
    price: Number(productData.price),
    category: productData.category?.trim() || detectCategory(productData.name),
    images: productData.images,
    imageUrl: productData.images[0] || "",
    sizeType: productData.sizeType,
    sizes: productData.sizes,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Updates an existing product document.
 */
export const updateProduct = async (
  id: string,
  productData: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "products", id);
  const updatePayload: any = { ...productData };

  if (productData.name) {
    updatePayload.name = productData.name.trim();
  }
  if (productData.description !== undefined) {
    updatePayload.description = productData.description.trim();
  }
  if (productData.category) {
    updatePayload.category = productData.category.trim();
  }
  if (productData.price !== undefined) {
    updatePayload.price = Number(productData.price);
  }
  if (productData.images) {
    updatePayload.images = productData.images;
    updatePayload.imageUrl = productData.images[0] || "";
  }

  await updateDoc(docRef, updatePayload);
};

/**
 * Safely deletes a product by doc ID.
 */
export const deleteProduct = async (id: string): Promise<void> => {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
};
