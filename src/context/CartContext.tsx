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
      }}
    >
      {children}
    </CartContext.Provider>
  );

};

export const useCart = () => useContext(CartContext);