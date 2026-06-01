"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext<any>(null);

export const CartProvider = ({
  children,
}: {
  children: React.ReactNode;
 }) => {

  const [cart, setCart] = useState<any[]>([]);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Load cart from localStorage
  useEffect(() => {

    const storedCart = localStorage.getItem("cart");

    if (storedCart) {

      setCart(JSON.parse(storedCart));

    }

  }, []);

  // Save cart to localStorage
  useEffect(() => {

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    );

  }, [cart]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Add to cart
  const addToCart = (product: any) => {

    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (existingProduct) {

      const updatedCart = cart.map((item) => {

        if (item.id === product.id) {

          return {
            ...item,
            quantity: item.quantity + 1,
          };

        }

        return item;

      });

      setCart(updatedCart);

    } else {

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ]);

    }

    showToast("Product added to cart", "success");
  };

  // Remove item
  const removeFromCart = (id: string) => {

    const updatedCart = cart.filter(
      (item) => item.id !== id
    );

    setCart(updatedCart);

  };

  // Increase quantity
  const increaseQuantity = (id: string) => {

    const updatedCart = cart.map((item) => {

      if (item.id === id) {

        return {
          ...item,
          quantity: item.quantity + 1,
        };

      }

      return item;

    });

    setCart(updatedCart);

  };

  // Decrease quantity
  const decreaseQuantity = (id: string) => {

    const updatedCart = cart.map((item) => {

      if (item.id === id) {

        return {
          ...item,
          quantity: item.quantity - 1,
        };

      }

      return item;

    }).filter((item) => item.quantity > 0);

    setCart(updatedCart);

  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        showToast,
      }}
    >
      {children}

      {/* Global Luxury Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 bg-[#111111] text-white px-6 py-4 rounded-xl font-bold shadow-2xl z-[9999] transition-all duration-300 flex items-center gap-3 border border-neutral-800 text-sm animate-fadeIn">
          {toastType === "success" && (
            <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black">
              ✓
            </span>
          )}
          {toastType === "error" && (
            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">
              !
            </span>
          )}
          <span className="tracking-wide text-white">{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );

};

export const useCart = () => useContext(CartContext);