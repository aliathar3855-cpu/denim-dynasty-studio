import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Script from "next/script";
import GlobalFooter from "@/components/GlobalFooter";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { brandConfig } from "@/config/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brandConfig.brandName,
  description: "Modern fashion ecommerce store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>

        {/* Razorpay script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />

        <CartProvider>
          <WishlistProvider>
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar />
            {children}
            <GlobalFooter />
          </WishlistProvider>
        </CartProvider>

      </body>
    </html>
  );
}