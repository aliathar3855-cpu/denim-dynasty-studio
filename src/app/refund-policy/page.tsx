"use client";

import Link from "next/link";
import { brandConfig } from "@/config/brand";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans">
      


      <article className="max-w-3xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">Returns</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
            Return & Refund Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#111111] mx-auto mt-4"></div>
        </header>

        <section className="space-y-6 text-[#666666] leading-relaxed">
          <p>
            We want you to be completely satisfied with your premium apparel purchase from {brandConfig.brandName}. If something is not right, we are here to support you with our returns and refund policy.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">1. Return Window</h3>
            <p>
              We accept return or size exchange requests within <strong>7 days</strong> of product delivery. To be eligible for a return or exchange, the item must be unworn, unwashed, in its original packaging, and with all original garment tags intact.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">2. How to Initiate a Return or Exchange</h3>
            <p>
              To start a request, please contact our support team at <strong>+91 7003951437</strong> or via email. Please provide:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your generated order number (e.g. DDS-XXXXXX).</li>
              <li>A clear description and photos showing the items you wish to return/exchange.</li>
              <li>Whether you prefer a direct size exchange or a financial refund.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">3. Return Shipping Costs</h3>
            <p>
              If you receive a defective, damaged, or incorrect item, we will arrange a reverse pickup at no additional cost to you. For standard size exchanges or returns due to preference change, shipping fees to return the product to our warehouse in Kolkata may apply.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">4. Refund Processing (Online Payments vs. COD)</h3>
            <p>
              Once your returned item is received at our facility and passes quality inspections, we will notify you and process your refund within 5 to 7 business days:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>For Online Payments (Credit Cards, UPI, Netbanking):</strong> Refunds will be reversed directly back through our payment gateway provider (Razorpay) to your original payment account.</li>
              <li><strong>For Cash on Delivery (COD) Orders:</strong> Since we do not have bank credentials from cash handovers, our customer service representative will contact you to securely obtain your UPI ID or Bank Account Details (Beneficiary Name, IFSC, Account Number) to transfer the amount via IMPS/NEFT.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">5. Non-Returnable Items</h3>
            <p>
              Certain custom modified batches or items bought during clearance warehouse sales are designated as final sale items and are not eligible for standard returns or refunds unless they arrive damaged.
            </p>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-neutral-200">
          <p className="text-xs text-neutral-400">
            For further queries regarding return logistics, please contact JS Faisal Dresses.
          </p>
        </footer>
      </article>

    </main>
  );
}
