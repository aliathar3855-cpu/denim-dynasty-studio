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
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login Successful");
      router.push("/admin/orders");

    } catch (err) {
      toast.error("Invalid credentials");
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