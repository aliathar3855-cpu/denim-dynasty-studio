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

export interface Product {
  id?: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  sizeType: "LETTER" | "NUMERIC";
  sizes: string[];
  createdAt?: Timestamp;
}

/**
 * Automatically detects product category based on product name keywords.
 */
export const detectCategory = (name: string): string => {
  const nameLower = name.toLowerCase();

  if (nameLower.includes("cord")) {
    return "cordset";
  }
  if (nameLower.includes("tshirt") || nameLower.includes("t-shirt")) {
    return "tshirt";
  }
  if (nameLower.includes("shirt")) {
    return "shirt";
  }
  if (nameLower.includes("track")) {
    return "trackpant";
  }
  if (nameLower.includes("3/4")) {
    return "3/4pant";
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

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, "id">),
  }));
};

/**
 * Fetches a single product by its Firestore document ID.
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, "products", id);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Product, "id">),
    };
  }

  return null;
};

/**
 * Saves a new product to Firestore, auto-generating the category.
 */
export const addProduct = async (
  productData: Omit<Product, "id" | "category" | "createdAt">
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

  const category = detectCategory(productData.name);

  const docRef = await addDoc(productsRef, {
    name: productData.name.trim(),
    price: Number(productData.price),
    category,
    images: productData.images,
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
    updatePayload.category = detectCategory(productData.name);
  }
  if (productData.price !== undefined) {
    updatePayload.price = Number(productData.price);
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
