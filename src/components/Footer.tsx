import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f8f8f8] text-[#111111] border-t border-neutral-200 py-16 px-6 md:px-12 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-wider">DENIM DYNASTY STUDIO</h3>
          <p className="text-[#666666] text-sm leading-relaxed">
            Premium boys fashion and curated streetwear. Elevating everyday wear with exceptional craftsmanship and modern designs.
          </p>
          <p className="text-xs text-neutral-400">
            A brand of <span className="font-semibold text-neutral-600">JS Faisal Dresses</span>
          </p>
        </div>

        {/* Customer Service Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#666666]">Support</h4>
          <ul className="space-y-2 text-sm text-[#666666]">
            <li>
              <Link href="/" className="hover:text-black transition">Home</Link>
            </li>
            <li>
              <Link href="/#products" className="hover:text-black transition">Shop Collection</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-black transition">Our Story (About)</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-black transition">Contact Support</Link>
            </li>
            <li>
              <Link href="/my-orders" className="hover:text-black transition">My Orders</Link>
            </li>
          </ul>
        </div>

        {/* Policies Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#666666]">Company Rules</h4>
          <ul className="space-y-2 text-sm text-[#666666]">
            <li>
              <Link href="/shipping-policy" className="hover:text-black transition">Shipping & Delivery</Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-black transition">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-black transition">Return & Refund Policy</Link>
            </li>
          </ul>
        </div>

        {/* Corporate Address & Registry Column */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#666666]">Corporate Registry</h4>
          <div className="text-sm text-[#666666] space-y-2 leading-relaxed">
            <p>
              <span className="block font-semibold text-black">JS Faisal Dresses</span>
              Owner: Shaban Azim
            </p>
            <p className="text-xs text-[#666666]">
              Q-283, Mudialy Road<br />
              PO Garden Reach, PS Metiabruz<br />
              Kolkata, West Bengal 700024
            </p>
            <p className="text-xs font-semibold text-black">
              GSTIN: 19AJMPA3270H1Z9
            </p>
            <p className="text-xs font-semibold text-black">
              Phone: +91 7003951437
            </p>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="max-w-6xl mx-auto border-t border-neutral-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-400 gap-4">
        <div>
          © {new Date().getFullYear()} Denim Dynasty Studio. All rights reserved.
        </div>
        <div className="flex gap-6 font-semibold flex-wrap justify-center md:justify-end">
          <a href="https://wa.me/917003951437" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 transition flex items-center gap-1">
            💬 Connect on WhatsApp
          </a>
          <a href="https://www.instagram.com/denimdynastystudio?utm_source=qr&igsh=dWZiYTZqNjF4ODNm" target="_blank" rel="noopener noreferrer" className="text-[#E1306C] hover:opacity-80 transition flex items-center gap-1">
            📸 Follow on Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
