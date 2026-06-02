"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const ADMIN_WHITELIST = [
  "glacierfromno@gmail.com",
  "denimdynastystudio@gmail.com",
  "aliathar3855@gmail.com",
];

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin/login");
      } else if (!user.email || !ADMIN_WHITELIST.includes(user.email.toLowerCase())) {
        try {
          await signOut(auth);
        } catch (err) {
          console.error("SignOut error:", err);
        }
        toast.error("Unauthorized access: email not whitelisted.");
        router.push("/admin/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#111111] p-6 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-neutral-500 text-sm">Checking authentication access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}