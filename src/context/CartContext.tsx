"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-hot-toast";

export interface CartItem {
  id: string;
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
  if (typeof item.id !== "string" || !item.id) return false;
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
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter and clean items matching target schema
          const migrated = parsed.filter(isValidCartItem).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            image: item.image || item.imageUrl || "",
            imageUrl: item.image || item.imageUrl || "",
            quantity: Number(item.quantity),
            selectedSize: item.selectedSize,
          }));
          setCart(migrated);
          // If items were removed/migrated, update localStorage immediately to sync state
          if (migrated.length !== parsed.length) {
            localStorage.setItem("cart", JSON.stringify(migrated));
          }
        }
      } catch (err) {
        console.error("Failed to parse and migrate cart from localStorage:", err);
        setCart([]);
        localStorage.setItem("cart", JSON.stringify([]));
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes, but only after it's loaded
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  // Add to cart
  const addToCart = (product: any) => {
    const id = product.id;
    const name = product.name;
    const price = Number(product.price);
    const image = product.image || product.imageUrl || "";
    
    // Automatically assign a size if missing or invalid (e.g. for one-size products)
    let selectedSize = product.selectedSize;
    if (typeof selectedSize !== "string" || !selectedSize.trim()) {
      selectedSize = "One Size";
    }

    setCart((prevCart) => {
      const existing = prevCart.find(
        (p) => p.id === id && p.selectedSize === selectedSize
      );

      if (existing) {
        return prevCart.map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id,
            name,
            price,
            image,
            imageUrl: image, // Sync imageUrl for backward compatibility
            selectedSize,
            quantity: 1,
          },
        ];
      }
    });

    toast.success("Product added to cart");
  };

  // Remove item
  const removeFromCart = (id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.id === id && item.selectedSize === selectedSize)
      )
    );
  };

  // Increase quantity
  const increaseQuantity = (id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.selectedSize === selectedSize
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQuantity = (id: string, selectedSize: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

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