"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    const inputEmail = email.trim();
    const inputPassword = password.trim();

    const staticCredentials = [
      { email: "glacierfromno@gmail.com", password: "faisal@8100" },
      { email: "denimdynastystudio@gmail.com", password: "Shaban1997@" },
      { email: "aliathar3855@gmail.com", password: "athar@321" },
    ];

    const match = staticCredentials.find(
      (cred) => cred.email === inputEmail && cred.password === inputPassword
    );

    if (match) {
      localStorage.setItem("admin", "true");
      toast.success("Login Successful");
      router.push("/admin");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] flex items-center justify-center px-6 font-sans">
      <div className="bg-[#f8f8f8] border border-neutral-200 p-8 rounded-3xl w-full max-w-md shadow-sm">

        <h1 className="text-4xl font-black mb-8 text-center text-[#111111] tracking-tight">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] mb-4 outline-none focus:border-neutral-500 transition"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 rounded-xl bg-white border border-neutral-300 text-[#111111] mb-6 outline-none focus:border-neutral-500 transition"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-[#111111] text-white py-4 rounded-xl font-bold hover:bg-neutral-800 transition shadow-md cursor-pointer"
        >
          Login
        </button>

      </div>
    </main>
  );
}