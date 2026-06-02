"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.");
      return;
    }
    // Simulate inquiry form submission
    setSubmitted(true);
    toast.success("Message submitted successfully!");
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => {
      setSubmitted(false);
    }, 5000);
  };

  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans">
      


      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        
        {/* Info Column */}
        <div className="space-y-8">
          <header className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">Contact Care</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
              Get In Touch
            </h1>
            <p className="text-[#666666] leading-relaxed">
              Have questions about sizing, custom bulks, or your order tracking? We are here to assist you.
            </p>
          </header>

          <div className="bg-[#f8f8f8] border border-neutral-200/80 rounded-3xl p-8 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block mb-1">Corporate Office</span>
              <strong className="text-lg text-black block">JS Faisal Dresses</strong>
              <p className="text-sm text-[#666666] mt-1 leading-relaxed">
                Q-283, Mudialy Road<br />
                PO Garden Reach, PS Metiabruz<br />
                Kolkata, West Bengal 700024
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
              <div>
                <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block mb-1">Owner</span>
                <span className="text-sm font-semibold text-black">Shaban Azim</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block mb-1">GSTIN Registry</span>
                <span className="text-sm font-semibold text-black">19AJMPA3270H1Z9</span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div>
                <span className="text-xs font-bold text-[#666666] uppercase tracking-wider block mb-1">Direct Helpline</span>
                <span className="text-lg font-bold text-black">+91 7003951437</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/917003951437"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition text-sm cursor-pointer whitespace-nowrap"
                >
                  💬 Chat on WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/denimdynastystudio?utm_source=qr&igsh=dWZiYTZqNjF4ODNm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl shadow-md transition text-sm cursor-pointer whitespace-nowrap"
                >
                  📸 Follow on Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-[#111111]">Send an Inquiry Message</h3>
          
          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-2xl text-center space-y-2">
              <strong className="block text-lg">Inquiry Submitted!</strong>
              <p className="text-xs">Thank you. We will review your message and get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 text-sm bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-[#111111] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 text-sm bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-[#111111] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Your Message
                </label>
                <textarea
                  placeholder="Tell us what you're looking for..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 text-sm bg-white border border-neutral-300 rounded-xl outline-none focus:border-[#38BDF8] text-[#111111] transition h-32"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#38BDF8] text-black py-4 rounded-xl font-bold hover:bg-[#0ea5e9] hover:text-white transition shadow-md cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

      </div>

    </main>
  );
}
