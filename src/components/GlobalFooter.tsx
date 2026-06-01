"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function GlobalFooter() {
  const pathname = usePathname();

  // Hide the e-commerce store footer on admin/admin-login pages
  const isAdmin =
    pathname?.startsWith("/admin") || pathname?.startsWith("/admin-login");

  if (isAdmin) return null;

  return <Footer />;
}
