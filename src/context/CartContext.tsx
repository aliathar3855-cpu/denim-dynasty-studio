"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { toast } from "react-hot-toast";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export interface CartItem {
  id: string;
  productId: string; // Include both for strict schema compatibility
  name: string;
  price: number;
  image: string;
  imageUrl?: string; // For backward compatibility with existing components
  selectedSize: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string, selectedSize: string) => void;
  increaseQuantity: (id: string, selectedSize: string) => void;
  decreaseQuantity: (id: string, selectedSize: string) => void;
  clearCart: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const CartContext = createContext<CartContextType | null>(null);

// Helper function to validate a cart item structure and detect corruption or missing size
const isValidCartItem = (item: any): boolean => {
  if (!item || typeof item !== "object") return false;
  
  const id = item.id || item.productId;
  if (typeof id !== "string" || !id) return false;
  
  if (typeof item.name !== "string" || !item.name) return false;
  
  const price = Number(item.price);
  if (isNaN(price) || price < 0) return false;
  
  const quantity = Number(item.quantity);
  if (isNaN(quantity) || quantity <= 0) return false;

  const image = item.image || item.imageUrl;
  if (typeof image !== "string" || !image) return false;

  if (typeof item.selectedSize !== "string" || !item.selectedSize.trim()) return false;

  return true;
};

export const CartProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage once on mount, running migration logic to purge legacy/corrupted items
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    console.log(`[localStorage Retrieval] Retrieved raw cart from localStorage:`, stored);
    let currentCart: CartItem[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter and clean items matching target schema
          currentCart = parsed.filter(isValidCartItem).map((item) => ({
            id: item.id || item.productId,
            productId: item.id || item.productId,
            name: item.name,
            price: Number(item.price),
            image: item.image || item.imageUrl || "",
            imageUrl: item.image || item.imageUrl || "",
            quantity: Number(item.quantity),
            selectedSize: item.selectedSize,
          }));
          setCart(currentCart);
          console.log(`[localStorage Retrieval] Cart successfully parsed and migrated:`, currentCart);
          // If items were removed/migrated, update localStorage immediately to sync state
          if (currentCart.length !== parsed.length) {
            localStorage.setItem("cart", JSON.stringify(currentCart));
            console.log(`[localStorage Save] Wrote post-migration cart to localStorage:`, currentCart);
          }
        }
      } catch (err) {
        console.error("[localStorage Retrieval] Failed to parse and migrate cart from localStorage:", err);
        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));
      }
    }
    setIsLoaded(true);

    // Verify product IDs against active Firestore products list and purge deleted ones
    const verifyAndPurgeDeleted = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const activeIds = new Set(snapshot.docs.map((doc) => doc.id));
        setCart((prevCart) => {
          const verified = prevCart.filter((item) => activeIds.has(item.id));
          if (verified.length !== prevCart.length) {
            localStorage.setItem("cart", JSON.stringify(verified));
            console.log(`[localStorage Save] Wrote post-deletion-sync cart to localStorage:`, verified);
            return verified;
          }
          return prevCart;
        });
      } catch (firestoreErr) {
        console.error("Failed to verify cart items with Firestore:", firestoreErr);
      }
    };
    verifyAndPurgeDeleted();
  }, []);

  // Save cart to localStorage whenever it changes, but only after it's loaded
  useEffect(() => {
    if (isLoaded) {
      console.log(`[localStorage Save] Saving cart to localStorage:`, cart);
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  }, []);

  // Add to cart
  const addToCart = useCallback((product: any) => {
    const id = product.id || product.productId;
    const name = product.name;
    const price = Number(product.price);
    const image = product.image || product.imageUrl || "";
    
    // Automatically assign a size if missing or invalid (e.g. for one-size products)
    let selectedSize = product.selectedSize;
    if (typeof selectedSize !== "string" || !selectedSize.trim()) {
      selectedSize = "One Size";
    }

    console.log(`[Add to Cart] Attempting to add product:`, {
      id,
      productId: id,
      name,
      price,
      selectedSize,
      image,
    });

    setCart((prevCart) => {
      const existing = prevCart.find(
        (p) => p.id === id && p.selectedSize === selectedSize
      );

      let updatedCart: CartItem[];
      if (existing) {
        updatedCart = prevCart.map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [
          ...prevCart,
          {
            id,
            productId: id,
            name,
            price,
            image,
            imageUrl: image, // Sync imageUrl for backward compatibility
            selectedSize,
            quantity: 1,
          },
        ];
      }

      console.log(`[Add to Cart] Product added. Updated cart:`, updatedCart);
      return updatedCart;
    });

    toast.success("Product added to cart");
  }, []);

  // Remove item
  const removeFromCart = useCallback((id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.id === id && item.selectedSize === selectedSize)
      )
    );
  }, []);

  // Increase quantity
  const increaseQuantity = useCallback((id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  // Decrease quantity
  const decreaseQuantity = useCallback((id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};