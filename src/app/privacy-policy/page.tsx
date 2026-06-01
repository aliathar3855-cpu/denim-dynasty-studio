"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
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
          <span className="text-xs font-bold uppercase tracking-widest text-[#666666]">Legal</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#111111]">
            Privacy Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#111111] mx-auto mt-4"></div>
        </header>

        <section className="space-y-6 text-[#666666] leading-relaxed">
          <p>
            At Denim Dynasty Studio, operated by JS Faisal Dresses, we respect your privacy and are committed to protecting the personal data you share with us. This policy describes how we collect, use, and secure your information when you visit or make a purchase from our e-commerce platform.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">1. Personal Information We Collect</h3>
            <p>
              When you browse our shop or make a purchase, we collect necessary personal details to complete your order, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact details: Name, Email Address, and Phone Number.</li>
              <li>Delivery details: Shipping Address, City, State, and Pin Code.</li>
              <li>Transaction details: Payment ID references (processed securely via Razorpay). We do not store raw credit card or UPI password credentials on our servers.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">2. How We Use Your Information</h3>
            <p>
              We utilize your information strictly to enhance your shopping experience and manage transactions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To fulfill, ship, and track your purchased goods.</li>
              <li>To send order confirmation notifications and email/SMS tracking status updates.</li>
              <li>To perform fraud prevention assessments and verification for COD transactions.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">3. Sharing Information with Third Parties</h3>
            <p>
              We do not sell or trade your personal information. We only share customer data with trusted third-party partners required to fulfill your orders:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Logistics Partners:</strong> Courier companies to deliver packages to your address.</li>
              <li><strong>Payment Gateway (Razorpay):</strong> To process online checkouts securely.</li>
              <li><strong>Database Services (Firebase/Firestore):</strong> To record order history and verify lookup tracking keys.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">4. Data Security</h3>
            <p>
              Your data security is our top priority. We use HTTPS encryption protocols for all page transitions and secure API endpoint routing. Additionally, access to client order information stored in Firestore is restricted by secure server authentication.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-black">5. Policy Updates</h3>
            <p>
              We may update this policy periodically to reflect changes in our operational procedures or legal regulatory guidelines. Please review this page regularly.
            </p>
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-neutral-200">
          <p className="text-xs text-neutral-400">
            If you have any questions about our privacy methods, please reach out to JS Faisal Dresses.
          </p>
        </footer>
      </article>

    </main>
  );
}
