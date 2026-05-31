"use client";

import { useEffect, useState } from "react";
import { listenToAuth } from "@/firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenToAuth((user) => {
      if (!user) {
        router.push("/admin/login");
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="text-white p-6">Checking access...</div>
    );
  }

  return <>{children}</>;
}