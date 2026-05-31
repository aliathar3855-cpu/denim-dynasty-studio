"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      router.push("/admin/orders");

    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="bg-zinc-900 p-10 rounded-2xl w-[400px] space-y-4">

        <h1 className="text-3xl font-bold">Admin Login</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-black"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-black"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-3 rounded-xl font-bold"
        >
          Login
        </button>

      </div>

    </main>
  );
}