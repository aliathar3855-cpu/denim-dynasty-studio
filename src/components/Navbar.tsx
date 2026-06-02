"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { brandConfig } from "@/config/brand";

export default function Navbar() {
  const pathname = usePathname() || "";
  const { cart } = useCart();

  const totalItems = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/#products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "My Orders", href: "/my-orders" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/#")) {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-neutral-200 bg-white sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Image
          src={brandConfig.logoPath}
          alt={brandConfig.brandName}
          width={40}
          height={40}
          priority
          className="w-8 h-8 md:w-9 md:h-9 object-contain"
        />
        <span className="text-sm sm:text-base md:text-lg font-black tracking-wider text-black">
          {brandConfig.brandName.toUpperCase()}
        </span>
      </Link>

      <div className="flex flex-wrap gap-4 md:gap-6 text-sm items-center justify-end">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`transition font-semibold ${
                active ? "text-[#38BDF8] font-bold" : "text-[#666666] hover:text-[#38BDF8]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}

        <Link
          href="/cart"
          className="relative bg-[#111111] hover:bg-neutral-800 text-white px-5 py-2.5 rounded-full font-semibold transition flex items-center gap-2 select-none"
        >
          <span className="relative flex items-center text-lg">
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2.5 -right-2 bg-[#38BDF8] text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black shadow-sm">
                {totalItems}
              </span>
            )}
          </span>
          <span className="hidden sm:inline text-sm">Cart</span>
        </Link>
      </div>
    </nav>
  );
}
