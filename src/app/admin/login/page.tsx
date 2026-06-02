"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const inputEmail = email.trim();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      // 1. Try standard Firebase authentication
      await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
      localStorage.setItem("admin", "true"); // Sync local session
      toast.success("Login Successful");
      router.push("/admin/orders");
    } catch (err: any) {
      // 2. Fallback to hardcoded static admin credentials if Firebase authentication fails
      if (inputEmail === "admin@denimdynasty.com" && inputPassword === "admin123") {
        localStorage.setItem("admin", "true");
        toast.success("Login Successful (Bypass)");
        router.push("/admin/orders");
      } else {
        console.error("Authentication failed:", err);
        toast.error("Invalid credentials");
      }
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans">

      <div className="bg-[#f8f8f8] border border-neutral-200 p-10 rounded-2xl w-[400px] space-y-4 shadow-sm">

        <h1 className="text-3xl font-black text-[#111111] tracking-tight">Admin Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-white border border-neutral-300 text-[#111111] outline-none focus:border-neutral-500 transition"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-[#111111] text-white py-3 rounded-xl font-bold hover:bg-neutral-800 transition shadow-md cursor-pointer"
        >
          Login
        </button>

      </div>

    </main>
  );
}