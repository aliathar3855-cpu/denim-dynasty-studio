"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-hot-toast";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (id: string) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (id: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wishlist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Store only valid string IDs
          const cleanWishlist = parsed.filter((id) => typeof id === "string");
          setWishlist(cleanWishlist);
        }
      } catch (err) {
        console.error("Failed to parse wishlist from localStorage:", err);
        setWishlist([]);
        localStorage.setItem("wishlist", JSON.stringify([]));
      }
    }
    setIsLoaded(true);
  }, []);

  // Save wishlist to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const addToWishlist = (id: string) => {
    if (!id) return;
    setWishlist((prev) => {
      if (prev.includes(id)) return prev;
      toast.success("Added to Wishlist ❤️");
      return [...prev, id];
    });
  };

  const removeFromWishlist = (id: string) => {
    if (!id) return;
    setWishlist((prev) => {
      if (!prev.includes(id)) return prev;
      toast.success("Removed from Wishlist");
      return prev.filter((item) => item !== id);
    });
  };

  const isInWishlist = (id: string) => {
    return wishlist.includes(id);
  };

  const toggleWishlist = (id: string) => {
    if (!id) return;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist(id);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    toast.success("Wishlist cleared");
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
