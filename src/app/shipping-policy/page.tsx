"use client";

import Link from "next/link";

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111] p-6 md:p-12 font-sans">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between max-w-4xl mx-auto mb-16 border-b border-neutral-200 pb-5">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#111111]">
          DENIM DYNASTY STUDIO
        </Link>
        <Link href="/" className="text-sm text-neutral-500 hover:text-black transition">
          ➔ Back to Shop
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">Deliveries</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
            Shipping & Delivery Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#111111] mx-auto mt-4"></div>
        </header>

        <section className="space-y-6 text-[#666666] leading-relaxed">
          <p>
            At Denim Dynasty Studio, we are dedicated to providing a premium delivery experience. Below are the terms and guidelines detailing how we package, dispatch, and track your luxury clothing purchases.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">1. Order Processing Times</h3>
            <p>
              All orders are processed within 1 to 2 business days (excluding Sundays and national holidays) after receiving your order confirmation email. You will receive an automated notification with tracking details when your order has been dispatched from our facility in Metiabruz, Kolkata.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">2. Domestic Shipping Rates & Estimates</h3>
            <p>
              We offer flat-rate shipping across all states in India. Shipping charges for your order will be calculated and displayed at checkout:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Standard Delivery:</strong> Delivered within 4 to 7 business days. Standard rates apply, or Free Shipping is provided for promotional order values.</li>
              <li><strong>Express Delivery (Metros & West Bengal):</strong> Delivered within 2 to 4 business days.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">3. Cash on Delivery (COD)</h3>
            <p>
              To offer a versatile payment structure, we support Cash on Delivery (COD) services across eligible pin codes. Please ensure you enter a valid mobile number and address at checkout. We perform verification calls for COD order confirmations prior to dispatch.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">4. Tracking Your Shipment</h3>
            <p>
              Once your shipment has been picked up by our logistics partner, you will receive an email and/or SMS containing your Order Reference Number. You can check the current transit status of your package at any time via our <Link href="/my-orders" className="text-black font-semibold underline hover:text-[#666666]">My Orders Dashboard</Link>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">5. Damaged or Lost Shipments</h3>
            <p>
              If your package arrives damaged or items are missing, please document the package layout with photos immediately and reach out to our customer care team via phone at <strong>+91 7003951437</strong> or via email within 48 hours of delivery.
            </p>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-neutral-200">
          <p className="text-xs text-neutral-400">
            For further questions regarding our shipping systems, feel free to contact JS Faisal Dresses.
          </p>
        </footer>
      </article>

    </main>
  );
}
